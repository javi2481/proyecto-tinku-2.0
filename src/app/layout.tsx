import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Layout del alumno. Activa `.student-scope` (Andika + tap targets infantiles).
 * Defense in depth: valida sesión + role=student en server.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata as { role?: string } | undefined)?.role;

  if (!user) redirect('/entrar');
  if (role !== 'student') redirect('/dashboard');

  return (
    <div className="student-scope min-h-screen bg-gradient-to-b from-tinku-sea/10 via-tinku-mist to-tinku-sand/30">
      {children}
    </div>
  );
}
