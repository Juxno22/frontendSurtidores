'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, redirectByRole } from '@/lib/auth';
import LoadingScreen from '@/components/LoadingScreen';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();

    router.replace(redirectByRole(user));
  }, [router]);

  return <LoadingScreen text="Redireccionando..." />;
}