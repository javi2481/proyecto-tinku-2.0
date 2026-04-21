'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

interface StudentRow {
  id: string
  parent_id: string | null
  name: string
  grade: number | null
  avatar: string | null
  total_xp: number
  streak_current: number
  streak_best: number
}

export interface IslandWithRegions {
  id: string
  name: string
  description: string | null
  regions: { id: string; name: string }[]
}

export async function studentLoginByCode(code: string): Promise<{ ok: true; studentId: string } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const supabase = await createClient();

  // Buscar student por código
  const result = await supabase
    .from('student_codes')
    .select('*, students(*)')
    .eq('code', code.toUpperCase())
    .single() as { data: { students: { id: string } } | null; error: null };

  if (result.error || !result.data) {
    return { ok: false, error: 'Código no válido' };
  }

  const studentId = result.data.students?.id;

  // Hacer login anónimo
  const { error: signInError } = await supabase.auth.signInAnonymously();

  if (signInError) {
    return { ok: false, error: 'Error al iniciar sesión' };
  }

  // Guardar student_id en cookie
  cookieStore.set('student_id', studentId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return { ok: true, studentId };
}

export async function getCurrentStudent(): Promise<StudentRow | null> {
  const cookieStore = await cookies();
  const studentId = cookieStore.get('student_id')?.value;

  if (!studentId) {
    return null;
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  return student;
}

export async function getStudentIslands(): Promise<IslandWithRegions[]> {
  const student = await getCurrentStudent();
  if (!student) {
    return [];
  }

  const supabase = await createClient();

  // Get islands with region info
  const { data: islands } = await supabase
    .from('islands')
    .select('*, regions(*)')
    .order('id');

  return islands || [];
}