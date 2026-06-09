'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import LoadingScreen from '@/components/LoadingScreen';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <AuthGuard roles={['ADMIN']}>
      <LoadingScreen text="Abriendo panel administrador..." />
    </AuthGuard>
  );
}