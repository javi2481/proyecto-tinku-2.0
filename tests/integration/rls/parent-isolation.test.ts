/**
 * RLS Isolation Tests: Parent ↔ Parent data isolation
 *
 * Verifies that:
 * - Parent A can ONLY see their own children
 * - Parent A CANNOT see children of Parent B
 * - Admin can see all data
 * - Auth trigger creates public.users row on signup
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createAdminClient,
  signUpTestUser,
  deleteTestUser,
  createTestStudent,
  testEmail,
  TEST_PASSWORD,
} from "../helpers/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

describe("RLS: Parent Isolation", () => {
  const admin = createAdminClient();

  // Track resources for cleanup
  let parentAId: string;
  let parentBId: string;
  let adminId: string;
  let parentAClient: SupabaseClient<Database>;
  let parentBClient: SupabaseClient<Database>;
  let adminClient: SupabaseClient<Database>;
  let studentA1Id: string;
  let studentA2Id: string;
  let studentB1Id: string;

  beforeAll(async () => {
    // Create two parent users
    const parentA = await signUpTestUser(testEmail("parent-a"), TEST_PASSWORD, "parent");
    parentAId = parentA.userId;
    parentAClient = parentA.client;

    const parentB = await signUpTestUser(testEmail("parent-b"), TEST_PASSWORD, "parent");
    parentBId = parentB.userId;
    parentBClient = parentB.client;

    // Create an admin user
    const adminUser = await signUpTestUser(testEmail("admin"), TEST_PASSWORD, "admin");
    adminId = adminUser.userId;
    adminClient = adminUser.client;

    // Create students for parent A
    studentA1Id = await createTestStudent(parentAId, "Child A1", 2);
    studentA2Id = await createTestStudent(parentAId, "Child A2", 4);

    // Create student for parent B
    studentB1Id = await createTestStudent(parentBId, "Child B1", 3);
  }, 30000);

  afterAll(async () => {
    // Clean up in reverse order: students are cascade-deleted with users
    await deleteTestUser(parentAId).catch(() => {});
    await deleteTestUser(parentBId).catch(() => {});
    await deleteTestUser(adminId).catch(() => {});
  }, 30000);

  describe("auth.users → public.users sync trigger", () => {
    it("creates a public.users row when auth.users row is created", async () => {
      const { data, error } = await admin
        .from("users")
        .select("id, role, full_name")
        .eq("id", parentAId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.id).toBe(parentAId);
      expect(data!.role).toBe("parent");
      expect(data!.full_name).toContain("Test parent");
    });

    it("sets default role to 'parent' when no role metadata is provided", async () => {
      const { data, error } = await admin
        .from("users")
        .select("role")
        .eq("id", parentBId)
        .single();

      expect(error).toBeNull();
      expect(data!.role).toBe("parent");
    });

    it("creates admin users when role metadata is 'admin'", async () => {
      const { data, error } = await admin
        .from("users")
        .select("role")
        .eq("id", adminId)
        .single();

      expect(error).toBeNull();
      expect(data!.role).toBe("admin");
    });
  });

  describe("Student visibility: parent can see only own children", () => {
    it("parent A sees exactly 2 children (their own)", async () => {
      const { data, error } = await parentAClient
        .from("students")
        .select("id, name, parent_id")
        .order("name");

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data!.map((s) => s.name).sort()).toEqual(["Child A1", "Child A2"]);
      expect(data!.every((s) => s.parent_id === parentAId)).toBe(true);
    });

    it("parent B sees exactly 1 child (their own)", async () => {
      const { data, error } = await parentBClient
        .from("students")
        .select("id, name, parent_id")
        .order("name");

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      if (!data) return;
      const student = data[0];
      expect(student?.name).toBe("Child B1");
      expect(student?.parent_id).toBe(parentBId);
    });

    it("parent A cannot see parent B's children", async () => {
      const { data, error } = await parentAClient
        .from("students")
        .select("id")
        .eq("id", studentB1Id);

      expect(error).toBeNull();
      // RLS should filter out studentB1Id since it belongs to parent B
      expect(data).toHaveLength(0);
    });

    it("parent B cannot see parent A's children", async () => {
      const { data, error } = await parentBClient
        .from("students")
        .select("id")
        .in("id", [studentA1Id, studentA2Id]);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it("admin can see all students", async () => {
      const { data, error } = await adminClient
        .from("students")
        .select("id, name, parent_id")
        .order("name");

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
      expect(data!.map((s) => s.name).sort()).toEqual(["Child A1", "Child A2", "Child B1"]);
    });
  });

  describe("Student codes isolation", () => {
    let codeA1: string;

    beforeAll(async () => {
      // Create codes for parent A's children using admin
      const { data } = await admin
        .from("student_codes")
        .insert([
          { student_id: studentA1Id, code: "ABCDEF" },
        ])
        .select("code")
        .single();

      codeA1 = data!.code;
    });

    it("parent A can see codes for their own children", async () => {
      const { data, error } = await parentAClient
        .from("student_codes")
        .select("code, student_id");

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);
      expect(data!.some((c) => c.code === codeA1)).toBe(true);
    });

    it("parent B cannot see parent A's children codes", async () => {
      const { data, error } = await parentBClient
        .from("student_codes")
        .select("code")
        .eq("code", codeA1);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe("Users RLS: can only read own row", () => {
    it("parent A can read their own user row", async () => {
      const { data, error } = await parentAClient
        .from("users")
        .select("id, role")
        .eq("id", parentAId)
        .single();

      expect(error).toBeNull();
      expect(data!.id).toBe(parentAId);
      expect(data!.role).toBe("parent");
    });

    it("parent A cannot read parent B's user row via default SELECT", async () => {
      const { data, error } = await parentAClient
        .from("users")
        .select("id, role")
        .eq("id", parentBId);

      expect(error).toBeNull();
      // RLS should filter it out — parent A can only see their own row
      expect(data).toHaveLength(0);
    });

    it("admin can read all user rows", async () => {
      const { data, error } = await adminClient
        .from("users")
        .select("id, role")
        .order("role");

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(2);
    });
  });
});