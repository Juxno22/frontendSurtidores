'use client';

import PowerBiDashboard from '@/components/admin/PowerBiDashboard';

export default function AdminDashboardPage() {
  return (
    <PowerBiDashboard
      role="ADMIN"
      title="Dashboard ejecutivo"
      subtitle="Productividad individual, comparativo contra reporte grupal y pendientes operativos."
    />
  );
}