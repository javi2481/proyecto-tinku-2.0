'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signupSchema, loginSchema } from '@/lib/auth';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getService() {
  return createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getCookieClient() {
  return createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
  });
}

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signup(formData: FormData): Promise<AuthResult> {
  const data = {
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Error de validación' };
  }

  const svc = getService();
  
  // Create auth user
  const { data: user, error } = await svc.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('already') || msg.includes('duplicate')) {
      return { ok: false, error: 'Email ya registrado' };
    }
    return { ok: false, error: 'Error al crear cuenta' };
  }

  const userId = user?.user?.id;
  if (!userId) {
    return { ok: false, error: 'Error al crear usuario' };
  }

  // Create profile in users table
  await svc.from('users').insert({
    id: userId,
    role: 'parent',
    full_name: parsed.data.full_name,
    email: parsed.data.email,
  });

  return { ok: true };
}

export async function login(formData: FormData): Promise<AuthResult> {
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: 'Email o contraseña inválidos' };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from server action
        }
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: 'Email o contraseña incorrectos' };
  }

  return { ok: true };
}

export async function logout() {
  const cookieStore = await cookies();
  const supabase = createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() {},
    },
  });
  await supabase.auth.signOut();
  redirect('/');
}

export async function getSession() {
  const cookieStore = await cookies();
  const supabase = createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() {},
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}