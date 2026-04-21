import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

const GRADE_LABEL: Record<number, string> = {
  1: '1° grado',
  2: '2° grado',
  3: '3° grado',
  4: '4° grado',
  5: '5° grado',
  6: '6° grado',
  7: '7° grado',
};

interface StudentWithCode {
  id: string;
  name: string;
  grade: number | null;
  avatar: string | null;
  total_xp: number;
  streak_current: number;
  student_codes: { code: string }[];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <p>Redirecting...</p>;
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user!.id)
    .single() as { data: { full_name: string | null; email: string | null } | null };

  // Get students for this parent
  const { data: students } = await supabase
    .from('students')
    .select('id, name, grade, avatar, total_xp, streak_current, student_codes(code)')
    .eq('parent_id', user!.id)
    .order('created_at', { ascending: true }) as { data: StudentWithCode[] | null };

  const hasStudents = (students?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            ¡Hola, {profile?.full_name || 'bienvenido'}!
          </h1>
          <p className="text-gray-500">Desde acá podés gestionar a tus hijos</p>
        </header>

        {!hasStudents && (
          <div className="bg-white rounded-lg border p-6 text-center space-y-4">
            <p className="text-gray-600">
              No tenés hijos registrados todavía.
            </p>
            <Link
              href="/dashboard/estudiantes/nuevo"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Agregar hijo
            </Link>
          </div>
        )}

        {hasStudents && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(students as StudentWithCode[]).map((student) => (
                <Link
                  key={student.id}
                  href={`/dashboard/estudiantes/${student.id}`}
                  className="block bg-white rounded-lg border p-4 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                      {student.avatar || '👶'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{student.name}</h3>
                      <p className="text-sm text-gray-500">
                        {student.grade ? GRADE_LABEL[student.grade] : 'Sin grado'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      🔥 {student.streak_current} días
                    </span>
                    <span className="text-gray-500">
                      ⭐ {student.total_xp} XP
                    </span>
                  </div>
                  {student.student_codes[0] && (
                    <div className="mt-2 pt-2 border-t text-center">
                      <span className="text-xs text-gray-400">Código: </span>
                      <span className="text-sm font-mono font-medium">
                        {student.student_codes[0].code}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            <div className="flex gap-4">
              <Link
                href="/dashboard/estudiantes/nuevo"
                className="flex-1 text-center px-4 py-2 border-2 border-dashed rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                + Agregar otro hijo
              </Link>
              <Link
                href="/entrar"
                className="flex-1 text-center px-4 py-2 border-2 border-dashed rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                Ingresar código
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}