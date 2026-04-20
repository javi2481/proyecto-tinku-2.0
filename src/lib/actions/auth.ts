'use server';

import { headers } from 'next/headers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export type ActionResult = { ok: boolean; redirectTo?: string; error?: string };

function getSupabaseService(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// =============================================================================
// SIGNUP
// =============================================================================

export async function signupAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '');

  // Simple validation
  if (!email.includes('@') || !email.includes('.')) return { ok: false, error: 'invalid_email' };
  if (password.length < 6) return { ok: false, error: 'password_short' };
  if (fullName.length < 2) return { ok: false, error: 'name_required' };

  const svc = getSupabaseService();

  // Create auth user
  const { data: created, error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'parent' },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('already') || msg.includes('duplicate')) return { ok: false, error: 'email_taken' };
    return { ok: false, error: 'create_failed' };
  }

  const userId = created.user?.id;
  if (!userId) return { ok: false, error: 'create_failed' };

  // Create profile
  await svc.from('users').insert({ id: userId, role: 'parent', full_name: fullName });

  return { ok: true, redirectTo: '/dashboard' };
}

// =============================================================================
// LOGIN
// =============================================================================

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!email.includes('@')) return { ok: false, error: 'invalid_email' };
  if (!password) return { ok: false, error: 'password_required' };

  const svc = getSupabaseService();
  const { error } = await svc.auth.signInWithPassword({ email, password });

  if (error) return { ok: false, error: 'invalid_credentials' };

  return { ok: true, redirectTo: '/dashboard' };
}

// =============================================================================
// LOGOUT
// =============================================================================

export async function logoutAction(): Promise<ActionResult> {
  const svc = getSupabaseService();
  await svc.auth.signOut();
  return { ok: true, redirectTo: '/' };
}