'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard';
import { DashboardUsuariosView } from '@/components/usuarios';

export default function UsuariosPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardUsuariosView />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
