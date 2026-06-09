'use client';

import PowerBiDashboard from '@/components/admin/PowerBiDashboard';

export default function SupervisorDashboardPage() {
  return (
    <PowerBiDashboard
      role="SUPERVISOR"
      title="Dashboard operativo"
      subtitle="Seguimiento diario de productividad, sesiones activas y diferencias contra reporte grupal."
    />
  );
}