'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard';
import { Users } from 'lucide-react';

export default function UsuariosPage() {
  return (
    <ProtectedRoute requireOwner>
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="text-indigo-600" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuarios</h1>
            <p className="text-gray-600 mb-6 max-w-md">
              Gestión de empleados y permisos (solo para dueños)
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Próximamente:</span> Esta sección se
                implementará en la siguiente fase del proyecto.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
