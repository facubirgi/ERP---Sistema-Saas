'use client';

import { Loader2 } from 'lucide-react';
import { useCaja } from '@/hooks/useCaja';
import { VistaCajaCerrada } from './VistaCajaCerrada';
import { VistaCajaAbierta } from './VistaCajaAbierta';

/**
 * Componente CajaDashboard (ORQUESTADOR PRINCIPAL)
 *
 * Responsabilidades:
 * 1. Al montar, obtener la sesión actual (fetchSesionActual)
 * 2. Evaluar el estado de la sesión
 * 3. Renderizar la vista correspondiente:
 *    - Si sesion === null → VistaCajaCerrada
 *    - Si sesion !== null → VistaCajaAbierta
 *
 * Este componente NO tiene lógica de negocio, solo orquestación.
 * Toda la lógica está en el contexto y hooks.
 *
 * Flujo de Estados:
 * - Loading → Muestra spinner
 * - Error → Muestra mensaje de error
 * - Sesion null → VistaCajaCerrada
 * - Sesion activa → VistaCajaAbierta
 */
export function CajaDashboard() {
  const { sesion, loading, error, refrescarSesion, esCajaAbierta } = useCaja();

  // NOTA: No llamamos refrescarSesion aquí porque el Navbar ya lo hace globalmente
  // Esto evita llamadas duplicadas que causan problemas de estado
  // Si necesitas refrescar manualmente, usa el botón de actualizar en la UI

  // ==================== ESTADOS DE CARGA ====================

  // Loading state
  if (loading && sesion === null) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 text-blue-600 animate-spin" size={48} />
          <p className="text-gray-600 font-medium">Cargando estado de caja...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="max-w-md w-full px-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">Error al cargar</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={refrescarSesion}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDERIZADO CONDICIONAL ====================

  // Si NO hay sesión → Modo CERRADA
  if (!esCajaAbierta) {
    return <VistaCajaCerrada />;
  }

  // Si HAY sesión → Modo ABIERTA
  return <VistaCajaAbierta />;
}
