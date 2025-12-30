'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard';
import { VentasProvider } from '@/contexts/VentasContext';
import { VentasContainer } from '@/components/ventas';

export default function VentasPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <VentasProvider>
          <div className="h-screen overflow-hidden">
            <VentasContainer />
          </div>
        </VentasProvider>
      </DashboardLayout>
    </ProtectedRoute>
  );
}