'use client';

import { useState } from 'react';
import { KeyRound, Loader2, X } from 'lucide-react';
import { usuariosApi } from '@/lib/usuariosApi';

export default function ChangePasswordModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    password_actual: '',
    password_nueva: '',
    password_confirmar: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.password_actual.trim()) {
      setError('Ingresa tu contraseña actual.');
      return;
    }

    if (!form.password_nueva || form.password_nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (form.password_nueva !== form.password_confirmar) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    try {
      setLoading(true);

      await usuariosApi.cambiarMiPassword({
        password_actual: form.password_actual,
        password_nueva: form.password_nueva
      });

      setForm({
        password_actual: '',
        password_nueva: '',
        password_confirmar: ''
      });

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Seguridad
            </p>

            <h3 className="mt-1 text-xl font-black text-slate-950">
              Cambiar contraseña
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Actualiza tu contraseña de acceso al sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Contraseña actual
            </span>

            <input
              name="password_actual"
              type="password"
              value={form.password_actual}
              onChange={handleChange}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              autoComplete="current-password"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Nueva contraseña
            </span>

            <input
              name="password_nueva"
              type="password"
              value={form.password_nueva}
              onChange={handleChange}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              autoComplete="new-password"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Confirmar nueva contraseña
            </span>

            <input
              name="password_confirmar"
              type="password"
              value={form.password_confirmar}
              onChange={handleChange}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-red-100"
              autoComplete="new-password"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-4 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
            {loading ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}