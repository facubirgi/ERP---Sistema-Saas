import React from 'react';
import { Receipt } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import type { MovimientoCaja } from '@/lib/types/caja.types';
import {
  TIPO_MOVIMIENTO_UI_MAP,
  METODO_PAGO_ICONS,
  METODO_PAGO_LABELS,
} from '@/lib/types/caja.types';

interface MovimientosTableProps {
  movimientos: MovimientoCaja[];
  formatearMonto: (monto: number) => string;
  formatearHora: (fecha: string) => string;
}

/**
 * Componente MovimientosTable
 *
 * Tabla de movimientos de la sesión actual
 *
 * Características:
 * - Ordenado por fecha DESC (más reciente primero)
 * - Badges de color según tipo (Ingreso verde / Egreso rojo)
 * - Iconos para métodos de pago
 * - Empty state cuando no hay movimientos
 * - Scroll vertical con altura máxima
 */
export const MovimientosTable = React.memo(function MovimientosTable({
  movimientos,
  formatearMonto,
  formatearHora,
}: MovimientosTableProps) {
  // Estado vacío
  if (movimientos.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
        <Receipt className="mx-auto mb-3 text-gray-400" size={48} />
        <p className="text-gray-600 font-medium">No hay movimientos registrados</p>
        <p className="text-gray-500 text-sm mt-1">
          Los movimientos de caja aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Receipt size={18} aria-hidden="true" />
          Movimientos del Día ({movimientos.length})
        </h4>
      </div>

      {/* Table Container con Scroll */}
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Hora
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Concepto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Método
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Monto
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {movimientos.map((movimiento) => {
              const tipoUI = TIPO_MOVIMIENTO_UI_MAP[movimiento.tipo];
              const iconoMetodo = METODO_PAGO_ICONS[movimiento.metodoPago];
              const labelMetodo = METODO_PAGO_LABELS[movimiento.metodoPago];
              const badgeVariant =
                movimiento.tipo === 'INGRESO' ? 'success' : 'danger';

              return (
                <tr
                  key={movimiento.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Hora */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatearHora(movimiento.fecha)}
                  </td>

                  {/* Concepto */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>
                      <p className="font-medium">{movimiento.descripcion}</p>
                    </div>
                  </td>

                  {/* Método */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden="true">
                        {iconoMetodo}
                      </span>
                      <span>{labelMetodo}</span>
                    </div>
                  </td>

                  {/* Tipo (Badge) */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={badgeVariant}>{tipoUI.label}</Badge>
                  </td>

                  {/* Monto */}
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-right ${tipoUI.textColor}`}
                  >
                    {movimiento.tipo === 'EGRESO' && '-'}
                    {formatearMonto(movimiento.monto)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con Total de Movimientos */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Total de movimientos:{' '}
          <span className="font-semibold text-gray-900">{movimientos.length}</span>
        </p>
      </div>
    </div>
  );
});
