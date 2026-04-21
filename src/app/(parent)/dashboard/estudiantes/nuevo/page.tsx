'use client';

import { useState } from 'react';
import { createClient as createSupabase } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function createClient() {
  return createSupabase(supabaseUrl, supabaseKey);
}
import Link from 'next/link';

const GRADES = [
  { value: 1, label: '1° grado' },
  { value: 2, label: '2° grado' },
  { value: 3, label: '3° grado' },
  { value: 4, label: '4° grado' },
  { value: 5, label: '5° grado' },
  { value: 6, label: '6° grado' },
  { value: 7, label: '7° grado' },
];

const generateCode = (): string => {
  const chars = 'ABCDEFGHJNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(1);
  const [avatar, setAvatar] = useState('👶');

  const avatars = ['👶', '🧒', '👦', '👧', '🧑', '👩', '🧒‍♂️', '🧒‍♀️'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('No hay sesión activa');
      setLoading(false);
      return;
    }

    // Create student
    const insertResult = await supabase
      .from('students')
      .insert({
        parent_id: user.id,
        name,
        grade,
        avatar,
        total_xp: 0,
        streak_current: 0,
        streak_best: 0,
      })
      .select()
      .single();

    const student = insertResult.data as { id: string } | null;
    const studentError = insertResult.error;

    if (studentError || !student) {
      setError('Error al crear hijo');
      setLoading(false);
      return;
    }

    // Generate and save code
    const code = generateCode();
    const codeResult = await supabase
      .from('student_codes')
      .insert({
        code,
        student_id: student.id,
      });

    if (codeResult.error) {
      setError('Error al generar código');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-md mx-auto p-6 space-y-6">
        <header className="flex items-center gap-2">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ← Volver
          </Link>
        </header>

        <h1 className="text-2xl font-semibold">Agregar hijo</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Nombre del niño/a"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Grado</label>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full p-3 border rounded-lg"
            >
              {GRADES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Avatar</label>
            <div className="flex gap-2 flex-wrap">
              {avatars.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`w-12 h-12 text-2xl rounded-full border-2 ${
                    avatar === a ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name}
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear'}
          </button>
        </form>
      </main>
    </div>
  );
}