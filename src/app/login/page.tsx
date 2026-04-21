'use client';

import { useState } from 'react';
import { login, signup } from '@/lib/actions/auth';
import { useRouter } from 'next/navigation';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    const result = mode === 'login' 
      ? await login(formData)
      : await signup(formData);
    
    const authResult = result as { ok: boolean; error?: string };
    
    if (authResult.ok) {
      router.push('/dashboard');
    } else {
      setError(authResult.error || 'Error');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">
            {mode === 'login' ? 'Bienvenido' : 'Crear cuenta'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === 'login' 
              ? 'Ingresá a tu cuenta de padre' 
              : ' Registrate para empezar'}
          </p>
        </div>

        {/* Google OAuth */}
        <GoogleAuthButton 
          label={mode === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">o</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form action={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                name="full_name"
                type="text"
                required
                className="w-full p-3 border rounded-lg"
                placeholder="Tu nombre completo"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full p-3 border rounded-lg"
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full p-3 border rounded-lg"
              placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-primary hover:underline"
          >
            {mode === 'login' 
              ? 'No tenés cuenta? Crear una' 
              : 'Ya tenés cuenta? Iniciar sesión'}
          </button>
        </div>
      </div>
    </main>
  );
}