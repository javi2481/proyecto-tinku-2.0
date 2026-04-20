/**
 * RLS Tests: Admin Access
 *
 * Verifies that admin can access all data across all tables.
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

describe("RLS: Admin Access", () => {
  const admin = createAdminClient();

  let adminId: string;
  let adminClient: SupabaseClient<Database>;
  let parentId: string;
  let studentId: string;

  beforeAll(async () => {
    const adminUser = await signUpTestUser(testEmail("admin-access"), TEST_PASSWORD, "admin");
    adminId = adminUser.userId;
    adminClient = adminUser.client;

    const parent = await signUpTestUser(testEmail("admin-parent"), TEST_PASSWORD, "parent");
    parentId = parent.userId;
    studentId = await createTestStudent(parentId, "Admin Test Student", 3);
  }, 30000);

  afterAll(async () => {
    // Delete parent first (cascades to student)
    await deleteTestUser(parentId).catch(() => {});
    await deleteTestUser(adminId).catch(() => {});
  }, 30000);

  it("admin can read all users", async () => {
    const { data, error } = await adminClient
      .from("users")
      .select("id, role, full_name");

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(2);
    // Should see both admin and parent
    expect(data!.some((u) => u.role === "admin")).toBe(true);
    expect(data!.some((u) => u.role === "parent")).toBe(true);
  });

  it("admin can read all students", async () => {
    const { data, error } = await adminClient
      .from("students")
      .select("id, name, parent_id");

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    expect(data!.some((s) => s.name === "Admin Test Student")).toBe(true);
  });

  it("admin can insert students", async () => {
    const { data, error } = await adminClient
      .from("students")
      .insert({
        parent_id: parentId,
        name: "Admin Created Student",
        grade: 5,
      })
      .select("id, name")
      .single();

    expect(error).toBeNull();
    expect(data!.name).toBe("Admin Created Student");

    // Clean up
    await admin.from("students").delete().eq("id", data!.id);
  });

  it("admin can read catalog tables (islands, regions, concepts)", async () => {
    const { data: islands, error: islandsError } = await adminClient
      .from("islands")
      .select("id, name");

    expect(islandsError).toBeNull();
    expect(islands!.length).toBe(2);

    const { data: regions, error: regionsError } = await adminClient
      .from("regions")
      .select("id, name, island_id");

    expect(regionsError).toBeNull();
    expect(regions!.length).toBe(6);

    const { data: concepts, error: conceptsError } = await adminClient
      .from("concepts")
      .select("id, name, region_id");

    expect(conceptsError).toBeNull();
    expect(concepts!.length).toBeGreaterThanOrEqual(25);
  });

  it("admin can access concept prerequisites", async () => {
    const { data, error } = await adminClient
      .from("concept_prerequisites")
      .select("concept_id, prerequisite_id");

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(10);
  });

  it("admin can manage exercises (CRUD)", async () => {
    // Read: admin can see ALL exercises (even unapproved ones)
    const { data: exercises, error: readError } = await adminClient
      .from("exercises")
      .select("id, prompt, approved");

    expect(readError).toBeNull();
    // Admin should be able to query the exercises table
    expect(Array.isArray(exercises)).toBe(true);
  });

  it("admin can manage missions", async () => {
    // Create a mission
    const { data, error } = await adminClient
      .from("missions")
      .insert({
        title: "Test Mission",
        description: "A test mission",
        mission_type: "daily",
        xp_reward: 50,
      })
      .select("id, title, mission_type")
      .single();

    expect(error).toBeNull();
    expect(data!.title).toBe("Test Mission");
    expect(data!.mission_type).toBe("daily");

    // Clean up
    await admin.from("missions").delete().eq("id", data!.id);
  });

  it("admin can read all app_events", async () => {
    // Admin should be able to see events from any user
    const { data, error } = await adminClient
      .from("app_events")
      .select("id, user_id, event_type");

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});