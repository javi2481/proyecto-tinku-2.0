'use server';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type Student = Database['public']['Tables']['students']['Row'];

function getSupabaseService(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// =============================================================================
// CREATE STUDENT
// =============================================================================

export async function createStudentAction(
  parentId: string,
  name: string,
  dateOfBirth?: string,
  grade?: number,
): Promise<{ ok: boolean; student?: Student; error?: string }> {
  const svc = getSupabaseService();

  const { data: student, error } = await svc
    .from('students')
    .insert({ parent_id: parentId, name, date_of_birth: dateOfBirth, grade })
    .select()
    .single();

  if (error) return { ok: false, error: 'create_failed' };
  return { ok: true, student: student as Student };
}

// =============================================================================
// GENERATE STUDENT CODE
// =============================================================================

export async function generateStudentCodeAction(studentId: string): Promise<{ ok: boolean; code?: string; error?: string }> {
  const svc = getSupabaseService();

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  // Check uniqueness
  const { data: existing } = await svc.from('student_codes').select('code').eq('code', code).maybeSingle();
  if (existing) {
    // Recursive retry
    return generateStudentCodeAction(studentId);
  }

  await svc.from('student_codes').insert({ code, student_id: studentId });
  return { ok: true, code };
}

// =============================================================================
// LIST STUDENTS
// =============================================================================

export async function listStudentsAction(parentId: string): Promise<Student[]> {
  const svc = getSupabaseService();
  const { data: students } = await svc.from('students').select('*').eq('parent_id', parentId);
  return (students ?? []) as Student[];
}

// =============================================================================
// UPDATE STUDENT
// =============================================================================

export async function updateStudentAction(
  studentId: string,
  data: { name?: string; avatar?: string; has_seen_welcome?: boolean },
): Promise<{ ok: boolean; student?: Student; error?: string }> {
  const svc = getSupabaseService();

  const { data: student, error } = await svc.from('students').update(data).eq('id', studentId).select().single();

  if (error) return { ok: false, error: 'update_failed' };
  return { ok: true, student: student as Student };
}

// =============================================================================
// AVATAR OPTIONS
// =============================================================================

export function getAvatarOptions(): { id: string; name: string; emoji: string }[] {
  return [
    { id: 'rocket', name: 'Cohete', emoji: '🚀' },
    { id: 'star', name: 'Estrella', emoji: '⭐' },
    { id: 'heart', name: 'Corazón', emoji: '❤️' },
    { id: 'gem', name: 'Gema', emoji: '💎' },
    { id: 'moon', name: 'Luna', emoji: '🌙' },
    { id: 'sun', name: 'Sol', emoji: '☀️' },
    { id: 'rainbow', name: 'Arcoíris', emoji: '🌈' },
    { id: 'fire', name: 'Fuego', emoji: '🔥' },
  ];
}