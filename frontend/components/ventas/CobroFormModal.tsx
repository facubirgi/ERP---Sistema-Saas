'use client';

// ============================================================================
// COBRO FORM MODAL - Formulario para Registrar Cobros de Deudas
// ============================================================================

import { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, AlertCircle, User, FileText } from 'lucide-react';
import { useVentas } from '@/contexts/VentasContext';
import { MetodoPago, type VentaListItemDto, type RegistrarCobroDto } from '@/lib/types/ventas.types';
import { validateAmount } from '@/lib/utils/validation.utils';

interface CobroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: VentaListItemDto | null;
  onSuccess?: () => void;
}

interface FormData {
  monto: string;
  metodoPago: MetodoPago;
}

interface FormErrors {
  monto?: string;
  metodoPago?: string;
}

export function CobroFormModal({ isOpen, onClose, venta, onSuccess }: CobroFormModalProps) {
  const { registrarCobro, loading, error } = useVentas();

  const [formData, setFormData] = useState<FormData>({
    monto: '',
    metodoPago: MetodoPago.EFECTIVO,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (isOpen && venta) {
      // Pre-llenar con el saldo pendiente completo
      setFormData({
        monto: venta.saldoPendiente.toString(),
        metodoPago: MetodoPago.EFECTIVO,
      });
    } else if (isOpen && !venta) {
      setFormData({
        monto: '',
        metodoPago: MetodoPago.EFECTIVO,
      });
    }
    setFormErrors({});
  }, [isOpen, venta]);

  // ============================================================================
  // VALIDACIONES
  // ============================================================================

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validar monto usando utilidad centralizada
    const amountValidation = validateAmount(formData.monto);
    
    if (!amountValidation.isValid) {
      errors.monto = amountValidation.error;
    } else if (venta && amountValidation.value! > venta.saldoPendiente) {
      errors.monto = `El monto no puede ser mayor al saldo pendiente ($${venta.saldoPendiente.toFixed(2)})`;
    }

    // Validar método de pago
    if (!formData.metodoPago) {
      errors.metodoPago = 'El método de pago es obligatorio';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!venta) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const cobroData: RegistrarCobroDto = {
        comprobanteId: venta.id,
        monto: parseFloat(formData.monto),
        metodoPago: formData.metodoPago,
      };

      const result = await registrarCobro(cobroData);
      if (result) {
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      console.error('Error al registrar cobro:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        monto: '',
        metodoPago: MetodoPago.EFECTIVO,
      });
      setFormErrors({});
      onClose();
    }
  };

  // Calcular saldo restante después del pago
  const calcularSaldoRestante = (): number => {
    if (!venta) return 0;
    const montoNum = parseFloat(formData.monto);
    if (isNaN(montoNum)) return venta.saldoPendiente;
    return Math.max(0, venta.saldoPendiente - montoNum);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen || !venta) return null;

  const saldoRestante = calcularSaldoRestante();
  const pagoCompleto = saldoRestante === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-linear-to-r from-green-600 to-green-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Registrar Cobro</h3>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg p-1 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <p className="mt-1 text-sm text-green-100">
              Ingresa el monto que el cliente está pagando
            </p>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {/* Error General */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertCircle className="text-red-600 shrink-0" size={20} />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Información de la Venta */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {/* Cliente */}
              <div className="flex items-center gap-2">
                <User className="text-gray-600" size={18} />
                <span className="text-sm font-medium text-gray-900">Cliente:</span>
                <span className="text-sm text-gray-700">
                  {venta.tercero?.nombre || 'Venta Anónima'}
                </span>
              </div>

              {/* Total de la Venta */}
              <div className="flex items-center gap-2">
                <FileText className="text-gray-600" size={18} />
                <span className="text-sm font-medium text-gray-900">Total Venta:</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${venta.total.toFixed(2)}
                </span>
              </div>

              {/* Saldo Pendiente */}
              <div className="flex items-center gap-2">
                <DollarSign className="text-red-600" size={18} />
                <span className="text-sm font-medium text-gray-900">Saldo Pendiente:</span>
                <span className="text-sm font-bold text-red-600">
                  ${venta.saldoPendiente.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Campo: Monto a Pagar */}
            <div>
              <label htmlFor="monto" className="block text-sm font-semibold text-gray-900 mb-2">
                Monto a Pagar <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={20}
                />
                <input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={venta.saldoPendiente}
                  value={formData.monto}
                  onChange={(e) => handleChange('monto', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 font-semibold bg-white ${
                    formErrors.monto
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.monto && (
                <p className="mt-1 text-sm text-red-600">{formErrors.monto}</p>
              )}

              {/* Botón de pago rápido */}
              {formData.monto !== venta.saldoPendiente.toString() && (
                <button
                  type="button"
                  onClick={() => handleChange('monto', venta.saldoPendiente.toString())}
                  className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Pagar saldo completo (${venta.saldoPendiente.toFixed(2)})
                </button>
              )}
            </div>

            {/* Campo: Método de Pago */}
            <div>
              <label htmlFor="metodoPago" className="block text-sm font-semibold text-gray-900 mb-2">
                Método de Pago <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={20}
                />
                <select
                  id="metodoPago"
                  value={formData.metodoPago}
                  onChange={(e) => handleChange('metodoPago', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 bg-white appearance-none cursor-pointer ${
                    formErrors.metodoPago
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  disabled={isSubmitting}
                >
                  <option value={MetodoPago.EFECTIVO} className="text-gray-900">
                    💵 Efectivo
                  </option>
                  <option value={MetodoPago.QR} className="text-gray-900">
                    📱 QR
                  </option>
                  <option value={MetodoPago.TARJETA} className="text-gray-900">
                    💳 Tarjeta
                  </option>
                  <option value={MetodoPago.TRANSFERENCIA} className="text-gray-900">
                    🏦 Transferencia
                  </option>
                </select>
              </div>
              {formErrors.metodoPago && (
                <p className="mt-1 text-sm text-red-600">{formErrors.metodoPago}</p>
              )}
            </div>

            {/* Resumen del Pago */}
            {formData.monto && !isNaN(parseFloat(formData.monto)) && (
              <div className={`rounded-lg p-4 ${pagoCompleto ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">Saldo Actual:</span>
                    <span className="font-semibold text-gray-900">
                      ${venta.saldoPendiente.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">Monto a Pagar:</span>
                    <span className="font-semibold text-green-700">
                      -${parseFloat(formData.monto).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className={`text-sm font-bold ${pagoCompleto ? 'text-green-700' : 'text-red-700'}`}>
                        Saldo Restante:
                      </span>
                      <span className={`text-lg font-bold ${pagoCompleto ? 'text-green-700' : 'text-red-700'}`}>
                        ${saldoRestante.toFixed(2)}
                      </span>
                    </div>
                    {pagoCompleto && (
                      <p className="text-xs text-green-700 text-center mt-2 font-medium">
                        ✓ La deuda quedará totalmente saldada
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <DollarSign size={20} />
                    <span>Registrar Cobro</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
