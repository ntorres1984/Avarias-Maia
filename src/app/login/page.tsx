'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('LOGIN RESULT:', data, error);

    setLoading(false);

    if (error) {
      setErro('Credenciais inválidas.');
      return;
    }

    window.location.href = '/dashboard';
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/parque-saude.jpg')" }}
      />

      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur">
          
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-sky-700">MAIA SAÚDE</h1>
            <p className="mt-2 text-lg font-semibold text-slate-800">
              Plataforma de Registo de Avarias
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Unidades de Saúde da Maia
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            <div>
              <label className="mb-1 block text-sm text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-700">
                Palavra-passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
                required
              />
            </div>

            {erro && (
              <div className="bg-red-100 text-red-600 p-2 rounded">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 text-white py-3 rounded-lg"
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
