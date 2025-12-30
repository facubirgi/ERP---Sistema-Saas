'use client';

// ============================================================================
// COBROS VIEW - Vista de Gestión de Cobros/Pagos
// ============================================================================

import { DollarSign, Calendar, Receipt } from 'lucide-react';

export function CobrosView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Gestión de Cobros</h3>
        <p className="text-gray-600">
          Registra cobros diferidos para ventas pendientes de pago
        </p>
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-linear-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <DollarSign className="text-white" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Registrar Cobro</h3>
          <p className="text-gray-600 mb-8">
            Selecciona una venta pendiente desde la vista de <strong>Cuenta Corriente</strong> o <strong>Ventas</strong> para registrar un cobro
          </p>

          <div className="grid grid-cols-1 gap-4 text-left bg-gray-50 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <Receipt className="text-blue-600 mt-1 shrink-0" size={20} />
              <div>
                <p className="font-semibold text-gray-900">Cobros parciales</p>
                <p className="text-sm text-gray-600">Permite registrar pagos parciales hasta completar el saldo</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="text-purple-600 mt-1 shrink-0" size={20} />
              <div>
                <p className="font-semibold text-gray-900">Historial completo</p>
                <p className="text-sm text-gray-600">Todos los cobros se registran con fecha y método de pago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="text-green-600 mt-1 shrink-0" size={20} />
              <div>
                <p className="font-semibold text-gray-900">Múltiples métodos</p>
                <p className="text-sm text-gray-600">Efectivo, QR, Tarjeta o Transferencia</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
