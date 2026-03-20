'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErro('Credenciais inválidas.');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/parque-saude.jpg')" }}
      />

      <div className="absolute inset-0 bg-black/55" />

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
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                placeholder="nome@exemplo.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Palavra-passe
              </label>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                required
              />
            </div>

            {erro && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-70"
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
