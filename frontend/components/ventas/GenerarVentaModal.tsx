'use client';

// ============================================================================
// GENERAR VENTA MODAL - Convertir Cotización a Venta
// ============================================================================

import { useState } from 'react';
import { X, DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import { MetodoPago } from '@/lib/types/ventas.types';
import { formatCurrency } from '@/lib/utils/format.utils';

interface GenerarVentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (montoPagado: number, metodoPago?: MetodoPago) => void;
  totalCotizacion: number;
  clienteNombre: string;
  loading?: boolean;
}

export function GenerarVentaModal({
  isOpen,
  onClose,
  onConfirm,
  totalCotizacion,
  clienteNombre,
  loading = false,
}: GenerarVentaModalProps) {
  const [montoPagado, setMontoPagado] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [pagoCompleto, setPagoCompleto] = useState(true);
  const [error, setError] = useState<string>('');

  // Manejar cambio en pagoCompleto
  const handlePagoCompletoChange = (completo: boolean) => {
    setPagoCompleto(completo);
    if (completo) {
      setMontoPagado(totalCotizacion.toString());
    } else {
      setMontoPagado('0');
    }
  };

  // Reiniciar formulario cuando se abre el modal
  const resetForm = () => {
    setMontoPagado(totalCotizacion.toString());
    setMetodoPago(MetodoPago.EFECTIVO);
    setPagoCompleto(true);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    const monto = parseFloat(montoPagado) || 0;

    // Validar que el monto no sea negativo
    if (monto < 0) {
      setError('El monto pagado no puede ser negativo');
      return;
    }

    // Validar que el monto no exceda el total
    if (monto > totalCotizacion) {
      setError('El monto pagado no puede ser mayor al total de la cotización');
      return;
    }

    // Si hay monto pagado, enviar con método de pago
    if (monto > 0) {
      onConfirm(monto, metodoPago);
    } else {
      // Si es a crédito (monto = 0), no enviar método de pago
      onConfirm(0, undefined);
    }
  };

  // Resetear el formulario cuando se abre el modal
  // Usar un ref para evitar que se ejecute en cada render
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    resetForm();
  } else if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  if (!isOpen) return null;

  const saldoPendiente = totalCotizacion - (parseFloat(montoPagado) || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Generar Venta
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info de la cotización */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cliente:</span>
              <span className="font-medium text-gray-900">{clienteNombre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-semibold text-lg text-gray-900">
                {formatCurrency(totalCotizacion)}
              </span>
            </div>
          </div>

          {/* Tipo de pago */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tipo de venta
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePagoCompletoChange(true)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  pagoCompleto
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Pago Completo</span>
              </button>
              <button
                type="button"
                onClick={() => handlePagoCompletoChange(false)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  !pagoCompleto
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">A Crédito / Parcial</span>
              </button>
            </div>
          </div>

          {/* Monto pagado */}
          {!pagoCompleto && (
            <div className="space-y-2">
              <label htmlFor="montoPagado" className="block text-sm font-medium text-gray-700">
                Monto pagado inicial (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  Bs.
                </span>
                <input
                  id="montoPagado"
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalCotizacion}
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500">
                Deja en 0 para venta completamente a crédito
              </p>
            </div>
          )}

          {/* Método de pago (solo si hay monto pagado) */}
          {(parseFloat(montoPagado) || 0) > 0 && (
            <div className="space-y-2">
              <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700">
                Método de pago
              </label>
              <select
                id="metodoPago"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value={MetodoPago.EFECTIVO}>Efectivo</option>
                <option value={MetodoPago.QR}>QR</option>
                <option value={MetodoPago.TARJETA}>Tarjeta</option>
                <option value={MetodoPago.TRANSFERENCIA}>Transferencia</option>
              </select>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Resumen */}
          {saldoPendiente > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Saldo pendiente:</span>
                <span className="font-semibold text-yellow-700">
                  {formatCurrency(saldoPendiente)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                El cliente quedará con cuenta pendiente
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generando...' : 'Generar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
