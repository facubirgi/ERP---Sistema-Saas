import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useCaja } from '@/hooks/useCaja';
import { useExportarCobros } from '@/hooks';
import { KpisCaja } from './KpisCaja';
import { BarraAcciones } from './BarraAcciones';
import { MovimientosTable } from './MovimientosTable';
import { ModalRegistrarGasto } from './ModalRegistrarGasto';
import { ModalCierre } from './ModalCierre';
import { ModalAnularVenta } from './ModalAnularVenta';
import type { MovimientoCaja } from '@/lib/types/caja.types';

/**
 * Componente VistaCajaAbierta
 *
 * Vista principal del módulo cuando HAY una sesión activa
 *
 * Estructura:
 * ┌─────────────────────────────────────────┐
 * │  KpisCaja (Saldo, Estado, Hora)         │
 * ├─────────────────────────────────────────┤
 * │  BarraAcciones (Registrar, Reporte)     │
 * ├─────────────────────────────────────────┤
 * │  MovimientosTable (Listado del día)     │
 * ├─────────────────────────────────────────┤
 * │  [Botón Cerrar Caja - Rojo]             │
 * └─────────────────────────────────────────┘
 *
 * Modales que maneja:
 * - ModalRegistrarGasto (para gastos/retiros)
 * - ModalCierre (para arqueo y cierre)
 */
export function VistaCajaAbierta() {
  const {
    sesion,
    movimientos,
    saldoActual,
    saldoEfectivo,
    formatearMonto,
    formatearHora,
    refrescarSesion,
  } = useCaja();

  const { exportarCobros, loading: loadingExportacion } = useExportarCobros();

  // Refrescar movimientos al montar el componente
  // Esto asegura que los movimientos creados desde otros módulos (ventas) se muestren
  useEffect(() => {
    refrescarSesion();
  }, [refrescarSesion]);

  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isAnularModalOpen, setIsAnularModalOpen] = useState(false);
  const [movimientoAAnular, setMovimientoAAnular] = useState<MovimientoCaja | null>(null);

  // Handler para abrir modal de anulación
  const handleAnularVenta = (movimiento: MovimientoCaja) => {
    setMovimientoAAnular(movimiento);
    setIsAnularModalOpen(true);
  };

  // Handler para cerrar modal de anulación
  const handleCloseAnularModal = () => {
    setIsAnularModalOpen(false);
    setMovimientoAAnular(null);
  };

  // Si no hay sesión, no renderizar nada (el CajaDashboard debería manejar esto)
  if (!sesion) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Sección 1: KPIs (Indicadores) */}
      <KpisCaja
        sesion={sesion}
        saldoActual={saldoActual}
        formatearMonto={formatearMonto}
        formatearHora={formatearHora}
      />

      {/* Sección 2: Barra de Acciones */}
      <BarraAcciones
        onRegistrarGasto={() => setIsGastoModalOpen(true)}
        onExportarCobros={exportarCobros}
        loadingExportacion={loadingExportacion}
      />

      {/* Sección 3: Tabla de Movimientos */}
      <MovimientosTable
        movimientos={movimientos}
        formatearMonto={formatearMonto}
        formatearHora={formatearHora}
        onAnularVenta={handleAnularVenta}
      />

      {/* Sección 4: Botón de Cierre (Destacado) */}
      <div className="border-t-2 border-gray-200 pt-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">
                Finalizar Turno
              </h3>
              <p className="text-sm text-red-700">
                Cierra la caja cuando termines tu turno. Deberás contar el
                efectivo físicamente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCierreModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Lock size={20} />
              <span>Cerrar Caja</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ModalRegistrarGasto
        isOpen={isGastoModalOpen}
        onClose={() => setIsGastoModalOpen(false)}
        onSuccess={() => {
          // Los movimientos se actualizan automáticamente
        }}
      />

      <ModalCierre
        isOpen={isCierreModalOpen}
        onClose={() => setIsCierreModalOpen(false)}
        saldoEsperadoEfectivo={saldoEfectivo}
        onSuccess={() => {
          // El cambio de vista se maneja automáticamente
        }}
      />

      <ModalAnularVenta
        isOpen={isAnularModalOpen}
        onClose={handleCloseAnularModal}
        movimiento={movimientoAAnular}
        onSuccess={() => {
          // Los movimientos se actualizan automáticamente via recargarSesion en el modal
        }}
      />
    </div>
  );
}
