'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackageCheck, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { saveSession, redirectByRole } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    usuario: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');

    if (!form.usuario.trim() || !form.password.trim()) {
      setError('Ingresa usuario y contraseña.');
      return;
    }

    try {
      setLoading(true);

      const data = await authApi.login({
        usuario: form.usuario.trim(),
        password: form.password
      });

      saveSession({
        token: data.token,
        user: data.user
      });

      router.replace(redirectByRole(data.user));
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)] shadow-lg">
            <PackageCheck size={34} />
          </div>

          <h1 className="text-3xl font-bold">
            Productividad Surtidores
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Control individual de surtido y comparativo contra reporte grupal.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-2xl"
        >
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Usuario
            </label>

            <input
              name="usuario"
              value={form.usuario}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              placeholder="admin"
              autoComplete="username"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Contraseña
            </label>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}