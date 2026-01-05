import { DollarSign, CreditCard } from 'lucide-react';
import { MetodoPago } from '@/lib/types/ventas.types';

interface PaymentSectionProps {
  montoPagado: string;
  onMontoPagadoChange: (valor: string) => void;
  metodoPago: MetodoPago;
  onMetodoPagoChange: (metodo: MetodoPago) => void;
  total: number;
  cambio: number;
  error?: string;
  formatCurrency: (value: number) => string;
}

import { useMemo } from 'react';

export function PaymentSection({
  montoPagado,
  onMontoPagadoChange,
  metodoPago,
  onMetodoPagoChange,
  total,
  cambio,
  error,
  formatCurrency,
}: PaymentSectionProps) {
  const montoPagadoNum = useMemo(() => parseFloat(montoPagado) || 0, [montoPagado]);
  const saldoPendiente = useMemo(() => Math.max(0, total - montoPagadoNum), [total, montoPagadoNum]);

  return (
    <div className="space-y-4">
      {/* Inputs de Pago */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monto Pagado */}
        <div>
          <label htmlFor="monto-pagado" className="block text-sm font-semibold text-gray-900 mb-2">
            Monto Pagado
          </label>
          <div className="relative">
            <DollarSign
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={20}
              aria-hidden="true"
            />
            <input
              id="monto-pagado"
              type="number"
              step="0.01"
              min="0"
              max="9999999.99"
              value={montoPagado}
              onChange={(e) => onMontoPagadoChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              aria-describedby={error ? 'payment-error' : undefined}
            />
          </div>
          {error && (
            <p id="payment-error" className="mt-1 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Método de Pago */}
        <div>
          <label htmlFor="metodo-pago" className="block text-sm font-semibold text-gray-900 mb-2">
            Método de Pago
          </label>
          <div className="relative">
            <CreditCard
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={20}
              aria-hidden="true"
            />
            <select
              id="metodo-pago"
              value={metodoPago}
              onChange={(e) => onMetodoPagoChange(e.target.value as MetodoPago)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
              style={{ color: '#000000', fontWeight: '500' }}
            >
              <option value={MetodoPago.EFECTIVO} style={{ color: '#000000', backgroundColor: '#ffffff', fontWeight: '500' }}>Efectivo</option>
              <option value={MetodoPago.QR} style={{ color: '#000000', backgroundColor: '#ffffff', fontWeight: '500' }}>QR</option>
              <option value={MetodoPago.TARJETA} style={{ color: '#000000', backgroundColor: '#ffffff', fontWeight: '500' }}>Tarjeta</option>
              <option value={MetodoPago.TRANSFERENCIA} style={{ color: '#000000', backgroundColor: '#ffffff', fontWeight: '500' }}>Transferencia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cambio */}
      {cambio > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-800">Cambio:</span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(cambio)}</span>
          </div>
        </div>
      )}

      {/* Resumen de Pago */}
      {total > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Total:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Pagado:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(montoPagadoNum)}</span>
          </div>
          <div className="flex justify-between text-base pt-2 border-t border-gray-300">
            <span className="font-bold text-gray-900">Saldo Pendiente:</span>
            <span className={`font-bold ${saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(saldoPendiente)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
