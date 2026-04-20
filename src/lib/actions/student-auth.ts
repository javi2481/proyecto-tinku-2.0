'use server';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

function getSupabaseService(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// =============================================================================
// STUDENT LOGIN WITH CODE
// =============================================================================

export type StudentAuthResult = { ok: boolean; studentName?: string; error?: string };

export async function studentLoginAction(
  _prev: StudentAuthResult | null,
  formData: FormData,
): Promise<StudentAuthResult> {
  const rawCode = String(formData.get('login_code') ?? '').trim().toUpperCase();

  // Validate format
  if (!rawCode || rawCode.length !== 6 || !/^[A-HJ-NP-Z2-9]{6}$/.test(rawCode)) {
    return { ok: false, error: 'invalid_code' };
  }

  const code = rawCode;
  const svc = getSupabaseService();

  // Find student by code
  const { data: student, error } = await svc
    .from('student_codes')
    .select('students!inner(name)')
    .eq('code', code)
    .maybeSingle();

  if (error || !student) {
    return { ok: false, error: 'invalid_code' };
  }

  // Sign in anonymously
  await svc.auth.signInAnonymously();

  return { ok: true, studentName: student.students.name };
}

// =============================================================================
// STUDENT LOGOUT
// =============================================================================

export async function studentLogoutAction(): Promise<{ ok: boolean }> {
  const svc = getSupabaseService();
  await svc.auth.signOut();
  return { ok: true };
}