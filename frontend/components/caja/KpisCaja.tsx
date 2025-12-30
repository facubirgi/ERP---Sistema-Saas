import React from 'react';
import { Wallet, Clock } from 'lucide-react';
import type { CajaSesion } from '@/lib/types/caja.types';
import { ESTADO_CAJA_UI_MAP } from '@/lib/types/caja.types';

interface KpisCajaProps {
  sesion: CajaSesion;
  saldoActual: number;
  formatearMonto: (monto: number) => string;
  formatearHora: (fecha: string) => string;
}

/**
 * Componente KpisCaja
 *
 * Muestra tres tarjetas de indicadores clave:
 * 1. Saldo Actual (destacado)
 * 2. Estado de la Caja (Abierta/Cerrada)
 * 3. Hora de Apertura
 *
 * Diseño:
 * - Grid de 3 columnas en desktop
 * - Stack vertical en mobile
 * - Tarjeta de saldo con fondo azul destacado
 */
export const KpisCaja = React.memo(function KpisCaja({
  sesion,
  saldoActual,
  formatearMonto,
  formatearHora,
}: KpisCajaProps) {
  const estadoUI = ESTADO_CAJA_UI_MAP[sesion.estado];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* KPI 1: SALDO ACTUAL */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="text-blue-600" size={24} aria-hidden="true" />
          <h3 className="text-sm font-medium text-blue-900">Saldo Total</h3>
        </div>
        <p className="text-3xl font-bold text-blue-700">
          {formatearMonto(saldoActual)}
        </p>
      </div>

      {/* KPI 2: ESTADO */}
      <div
        className={`${estadoUI.bgColor} border-2 ${estadoUI.borderColor} rounded-lg p-6`}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl" aria-hidden="true">
            {estadoUI.icon}
          </span>
          <h3 className={`text-sm font-medium ${estadoUI.textColor}`}>
            Estado de Caja
          </h3>
        </div>
        <p className={`text-2xl font-bold ${estadoUI.textColor}`}>
          {estadoUI.label.toUpperCase()}
        </p>
      </div>

      {/* KPI 3: HORA DE APERTURA */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="text-gray-600" size={24} aria-hidden="true" />
          <h3 className="text-sm font-medium text-gray-900">Abierta Desde</h3>
        </div>
        <p className="text-2xl font-bold text-gray-700">
          {formatearHora(sesion.fechaApertura)}
        </p>
      </div>
    </div>
  );
});
