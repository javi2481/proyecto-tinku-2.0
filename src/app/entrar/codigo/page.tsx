'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentLoginByCode } from '@/lib/actions/student';

export default function StudentLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await studentLoginByCode(code) as { ok: boolean; error?: string };

    if (!result.ok) {
      setError(result.error || 'Error');
      setLoading(false);
      return;
    }

    router.push('/islas');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold">🚀</h1>
        <p className="text-muted-foreground">Ingresá tu código de aventura</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            maxLength={6}
            className="w-full p-4 text-center text-2xl tracking-widest border-2 border-primary rounded-xl font-mono"
            required
          />
          
          {error && <p className="text-red-600">{error}</p>}
          
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full p-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Entrando...' : '¡Empezar aventura!'}
          </button>
        </form>
      </div>
    </main>
  );
}