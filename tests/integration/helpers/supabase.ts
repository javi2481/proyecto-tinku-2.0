/**
 * Test helpers for Supabase integration tests.
 * Provides authenticated clients for different roles
 * and utility functions for setup/teardown.
 *
 * IMPORTANT: These tests connect to the REAL Supabase database.
 * They create and clean up test data using the service role key.
 * Run with: pnpm test -- tests/integration/
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Admin client that bypasses RLS — use for setup/teardown only */
export function createAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Anonymous (unauthenticated) client */
export function createAnonClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Authenticated client for a specific user */
export function createAuthClient(
  email: string,
  password: string
): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Sign up a test user and return the authenticated client + user ID */
export async function signUpTestUser(
  email: string,
  password: string,
  role: "parent" | "admin" = "parent"
): Promise<{ client: SupabaseClient<Database>; userId: string }> {
  const client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name: `Test ${role}` },
    },
  });

  if (error) throw new Error(`Failed to sign up test user: ${error.message}`);
  if (!data.user) throw new Error("No user returned from sign up");

  // If role is admin, update the users table role using admin client
  if (role === "admin") {
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("users")
      .update({ role: "admin" })
      .eq("id", data.user.id);

    if (updateError) {
      throw new Error(`Failed to update user role to admin: ${updateError.message}`);
    }
  }

  return { client, userId: data.user.id };
}

/** Delete a test user (and all their data via CASCADE) */
export async function deleteTestUser(userId: string): Promise<void> {
  const admin = createAdminClient();

  // Delete from public.users first (will cascade to students, etc.)
  await admin.from("users").delete().eq("id", userId);

  // Delete from auth.users
  await admin.auth.admin.deleteUser(userId);
}

/** Create a test student for a parent user */
export async function createTestStudent(
  parentId: string,
  name: string = "Test Student",
  grade: number = 3
): Promise<string> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("students")
    .insert({ parent_id: parentId, name, grade })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create test student: ${error.message}`);
  return data.id;
}

/** Clean up test student and related data */
export async function deleteTestStudent(studentId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("students").delete().eq("id", studentId);
}

/** Generate a unique email for tests */
export function testEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.tinku`;
}

/** Password for test users */
export const TEST_PASSWORD = "Test123456!";