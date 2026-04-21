'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  label?: string;
  next?: string;
}

export function GoogleAuthButton({ label = 'Continuar con Google', next = '/dashboard' }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    setErr(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        setErr('No pudimos conectar con Google. Probá de nuevo.');
        setLoading(false);
      }
    } catch {
      setErr('Algo falló. Probá de nuevo en unos segundos.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full h-12 rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-60 disabled:cursor-wait"
      >
        <svg aria-hidden viewBox="0 0 48 48" width="22" height="22">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2 1.5-4.5 2.4-7.3 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.4 39.6 16.1 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.5l6.3 5.2c-.4.4 6.3-4.5 6.3-14.2 0-1.3-.1-2.3-.4-4z"/>
        </svg>
        <span>{loading ? 'Abriendo Google...' : label}</span>
      </button>
      {err && (
        <p role="alert" className="text-xs text-red-600 text-center">
          {err}
        </p>
      )}
    </div>
  );
}