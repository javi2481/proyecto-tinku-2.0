/**
 * RLS Isolation Tests: Student ↔ Student data isolation
 *
 * Verifies that:
 * - A parent can read data for their own students
 * - One student's data is not visible to a different student's parent
 * - Admin can see all student-related data
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

describe("RLS: Student Data Isolation", () => {
  const admin = createAdminClient();

  let parentAId: string;
  let parentBId: string;
  let parentAClient: SupabaseClient<Database>;
  let parentBClient: SupabaseClient<Database>;
  let adminClient: SupabaseClient<Database>;
  let studentA1Id: string;
  let studentB1Id: string;
  let conceptId: string;

  beforeAll(async () => {
    // Create parent users
    const parentA = await signUpTestUser(testEmail("stu-parent-a"), TEST_PASSWORD, "parent");
    parentAId = parentA.userId;
    parentAClient = parentA.client;

    const parentB = await signUpTestUser(testEmail("stu-parent-b"), TEST_PASSWORD, "parent");
    parentBId = parentB.userId;
    parentBClient = parentB.client;

    // Create admin
    const adminUser = await signUpTestUser(testEmail("stu-admin"), TEST_PASSWORD, "admin");
    adminClient = adminUser.client;

    // Create students
    studentA1Id = await createTestStudent(parentAId, "Student A1", 3);
    studentB1Id = await createTestStudent(parentBId, "Student B1", 2);

    // Get a concept ID for test data
    const { data: concepts } = await admin
      .from("concepts")
      .select("id")
      .limit(1)
      .single();

    if (concepts) {
      conceptId = concepts.id;
    }
  }, 30000);

  afterAll(async () => {
    await deleteTestUser(parentAId).catch(() => {});
    await deleteTestUser(parentBId).catch(() => {});
  }, 30000);

  describe("student_concept_state isolation", () => {
    beforeAll(async () => {
      // Create concept state for student A
      await admin
        .from("student_concept_state")
        .insert({
          student_id: studentA1Id,
          concept_id: conceptId,
          p_known: 0.75,
          mastery: "in_progress",
        });

      // Create concept state for student B
      const { data: concepts2List } = await admin
        .from("concepts")
        .select("id")
        .range(1, 1);

      const concept2 = concepts2List?.[0];
      if (concept2) {
        await admin
          .from("student_concept_state")
          .insert({
            student_id: studentB1Id,
            concept_id: concept2.id,
            p_known: 0.3,
            mastery: "not_started",
          });
      }
    });

    it("parent A sees own student's concept state", async () => {
      const { data, error } = await parentAClient
        .from("student_concept_state")
        .select("student_id, p_known, mastery")
        .eq("student_id", studentA1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      if (!data) return;
      const state = data[0];
      expect(state?.p_known).toBe(0.75);
    });

    it("parent A cannot see parent B's student data", async () => {
      const { data, error } = await parentAClient
        .from("student_concept_state")
        .select("student_id")
        .eq("student_id", studentB1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it("parent B cannot see parent A's student data", async () => {
      const { data, error } = await parentBClient
        .from("student_concept_state")
        .select("student_id")
        .eq("student_id", studentA1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it("admin can see all concept states", async () => {
      const { data, error } = await adminClient
        .from("student_concept_state")
        .select("student_id, mastery");

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("student_levels auto-creation trigger", () => {
    it("student_levels row is auto-created when student is inserted", async () => {
      // Verify the trigger created a student_levels row for studentA1
      const { data, error } = await admin
        .from("student_levels")
        .select("student_id, level, xp, title")
        .eq("student_id", studentA1Id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.level).toBe(1);
      expect(data!.xp).toBe(0);
      expect(data!.title).toBe("Explorador Novato");
    });
  });

  describe("student_coins isolation", () => {
    beforeAll(async () => {
      await admin.from("student_coins").insert([
        { student_id: studentA1Id, province: "moneda-puerto" },
        { student_id: studentA1Id, province: "moneda-valle" },
      ]);
    });

    it("parent A can see their student's coins", async () => {
      const { data, error } = await parentAClient
        .from("student_coins")
        .select("student_id, province")
        .eq("student_id", studentA1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it("parent B cannot see parent A's student coins", async () => {
      const { data, error } = await parentBClient
        .from("student_coins")
        .select("student_id")
        .eq("student_id", studentA1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe("student_ship_parts isolation", () => {
    beforeAll(async () => {
      await admin.from("student_ship_parts").insert({
        student_id: studentA1Id,
        part_type: "sail",
      });
    });

    it("parent A can see their student's ship parts", async () => {
      const { data, error } = await parentAClient
        .from("student_ship_parts")
        .select("student_id, part_type")
        .eq("student_id", studentA1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      if (!data) return;
      const shipPart = data[0];
      expect(shipPart?.part_type).toBe("sail");
    });

    it("parent B cannot see parent A's student ship parts", async () => {
      const { data, error } = await parentBClient
        .from("student_ship_parts")
        .select("student_id")
        .eq("student_id", studentA1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe("app_events RLS", () => {
    it("users can insert their own events", async () => {
      const { data, error } = await parentAClient
        .from("app_events")
        .insert({
          user_id: parentAId,
          event_type: "test_event",
          payload: { action: "test" },
        })
        .select("id")
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Clean up
      await admin.from("app_events").delete().eq("id", data!.id);
    });

    it("users can only read their own events", async () => {
      // Insert events for both parents
      await admin.from("app_events").insert([
        { user_id: parentAId, event_type: "parent_a_event", payload: {} },
        { user_id: parentBId, event_type: "parent_b_event", payload: {} },
      ]);

      const { data, error } = await parentAClient
        .from("app_events")
        .select("user_id, event_type")
        .order("created_at", { ascending: false });

      expect(error).toBeNull();
      // Parent A should only see their own events
      expect(data!.every((e) => e.user_id === parentAId)).toBe(true);
    });

    it("admin can read all events", async () => {
      const { data, error } = await adminClient
        .from("app_events")
        .select("user_id, event_type")
        .order("created_at", { ascending: false });

      expect(error).toBeNull();
      // Admin should see events from both parents
      expect(data!.length).toBeGreaterThanOrEqual(2);
    });
  });
});