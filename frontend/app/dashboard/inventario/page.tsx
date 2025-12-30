'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard';
import { InventarioProvider } from '@/contexts/InventarioContext';
import { InventarioContainer } from '@/components/inventario';

export default function InventarioPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <InventarioProvider>
          <div className="h-screen overflow-hidden">
            <InventarioContainer />
          </div>
        </InventarioProvider>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
