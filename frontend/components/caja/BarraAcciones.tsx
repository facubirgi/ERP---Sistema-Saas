import React from 'react';
import { Minus, FileSpreadsheet } from 'lucide-react';

interface BarraAccionesProps {
  onRegistrarGasto: () => void;
  onExportarCobros: () => void;
  loadingExportacion?: boolean;
  isOwner?: boolean;
}

/**
 * Componente BarraAcciones
 *
 * Barra de botones de acciones rápidas:
 * 1. Registrar Gasto/Retiro (solo dueño)
 * 2. Exportar Cobros (ambos roles)
 *
 * Layout:
 * - Flexbox horizontal en desktop
 * - Stack vertical en mobile
 */
export const BarraAcciones = React.memo(function BarraAcciones({
  onRegistrarGasto,
  onExportarCobros,
  loadingExportacion = false,
  isOwner = false,
}: BarraAccionesProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Botón Registrar Gasto (solo dueño) */}
      {isOwner && (
        <button
          type="button"
          onClick={onRegistrarGasto}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <Minus size={18} aria-hidden="true" />
          <span>Registrar Gasto / Retiro</span>
        </button>
      )}

      {/* Botón Exportar Cobros (ambos roles) */}
      <button
        type="button"
        onClick={onExportarCobros}
        disabled={loadingExportacion}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileSpreadsheet size={18} aria-hidden="true" />
        <span>{loadingExportacion ? 'Exportando...' : 'Exportar Cobros (Excel)'}</span>
      </button>
    </div>
  );
});
