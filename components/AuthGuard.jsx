'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearSession } from '@/lib/auth';
import { authApi } from '@/lib/api';
import LoadingScreen from './LoadingScreen';

export default function AuthGuard({ children, roles = [] }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const localUser = getUser();

        if (!localUser) {
          router.replace('/login');
          return;
        }

        const data = await authApi.me();
        const user = data.user;

        if (roles.length > 0 && !roles.includes(user.rol)) {
          if (user.rol === 'SURTIDOR') router.replace('/surtidor');
          else if (user.rol === 'ADMIN') router.replace('/admin');
          else if (user.rol === 'SUPERVISOR') router.replace('/supervisor');
          else router.replace('/login');

          return;
        }

        setReady(true);
      } catch {
        clearSession();
        router.replace('/login');
      }
    }

    checkSession();
  }, [router, roles]);

  if (!ready) {
    return <LoadingScreen text="Validando sesión..." />;
  }

  return children;
}