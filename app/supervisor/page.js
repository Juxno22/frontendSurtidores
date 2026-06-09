'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import LoadingScreen from '@/components/LoadingScreen';

export default function SupervisorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/supervisor/dashboard');
  }, [router]);

  return (
    <AuthGuard roles={['SUPERVISOR']}>
      <LoadingScreen text="Abriendo panel supervisor..." />
    </AuthGuard>
  );
}