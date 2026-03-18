'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError('Credenciais inválidas.');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Entrar</h1>
          <p className="text-sm text-slate-600">Plataforma de Avarias · Maia</p>
        </div>
        <input className="w-full rounded-xl border p-3" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-xl border p-3" type="password" placeholder="Palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="w-full rounded-xl bg-slate-900 p-3 text-white disabled:opacity-60" disabled={loading}>{loading ? 'A entrar...' : 'Entrar'}</button>
      </form>
    </main>
  );
}
