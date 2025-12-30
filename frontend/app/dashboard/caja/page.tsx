'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard';
import { CajaDashboard } from '@/components/caja';

/**
 * Página del Módulo de Caja (Tesorería)
 *
 * Estructura de capas:
 * 1. ProtectedRoute - Verifica autenticación
 * 2. DashboardLayout - Layout con sidebar y navbar (incluye CajaProvider)
 * 3. CajaDashboard - Componente orquestador principal
 *
 * El CajaDashboard se encarga de:
 * - Obtener la sesión actual
 * - Renderizar VistaCajaCerrada o VistaCajaAbierta según el estado
 */
export default function CajaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CajaDashboard />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
