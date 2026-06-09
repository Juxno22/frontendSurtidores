'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ChevronDown,
  KeyRound,
  LogOut,
  UserRound
} from 'lucide-react';

import { clearSession, getUser } from '@/lib/auth';
import ChangePasswordModal from './ChangePasswordModal';

export default function UserAccountMenu({ compact = false }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [message, setMessage] = useState('');

  const user = getUser();

  function handleLogout() {
    clearSession();
    router.replace('/login');
  }

  function showSuccess() {
    setMessage('Contraseña actualizada correctamente.');

    window.setTimeout(() => {
      setMessage('');
    }, 3500);
  }

  if (compact) {
    return (
      <>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <UserRound size={19} />
          </button>

          {open ? (
            <div className="absolute right-0 top-12 z-50 w-72 rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-slate-200">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="truncate text-sm font-black text-slate-950">
                  {user?.nombre || 'Usuario'}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {user?.rol || 'SIN_ROL'}
                </p>
              </div>

              {message ? (
                <div className="mt-2 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                  {message}
                </div>
              ) : null}

              <div className="mt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setPasswordOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-100"
                >
                  <KeyRound size={17} />
                  Cambiar contraseña
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <ChangePasswordModal
          open={passwordOpen}
          onClose={() => setPasswordOpen(false)}
          onSuccess={showSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-3xl bg-slate-50 p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200">
            <UserRound size={20} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Sesión
            </p>
            <p className="truncate text-sm font-black text-slate-950">
              {user?.nombre || 'Usuario'}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              {user?.rol || 'SIN_ROL'}
            </p>
          </div>
        </div>

        {message ? (
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
            <CheckCircle2 size={15} />
            {message}
          </div>
        ) : null}

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <KeyRound size={17} />
            Cambiar contraseña
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </div>

      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSuccess={showSuccess}
      />
    </>
  );
}