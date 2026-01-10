import { useState } from 'react';
import { Minus } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useCaja } from '@/hooks/useCaja';
import {
  TipoMovimiento,
  MetodoPagoCaja,
  OrigenMovimiento,
  METODO_PAGO_LABELS,
} from '@/lib/types/caja.types';

interface ModalRegistrarGastoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Componente ModalRegistrarGasto
 *
 * Modal para registrar gastos o retiros manuales
 *
 * Campos:
 * - Concepto (required)
 * - Monto (required, > 0)
 * - Método de pago (select)
 * - Referencia (opcional)
 *
 * Flujo:
 * 1. Usuario llena formulario
 * 2. Confirma registro
 * 3. Se crea movimiento tipo EGRESO
 * 4. Se actualizan totales automáticamente
 */
export function ModalRegistrarGasto({
  isOpen,
  onClose,
  onSuccess,
}: ModalRegistrarGastoProps) {
  const { registrarGasto, loading } = useCaja();

  const [formData, setFormData] = useState({
    concepto: '',
    monto: '',
    metodoPago: MetodoPagoCaja.EFECTIVO,
    referencia: '',
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpiar error al editar
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.concepto.trim()) {
      errors.concepto = 'El concepto es requerido';
    }

    const monto = parseFloat(formData.monto);
    if (isNaN(monto) || monto <= 0) {
      errors.monto = 'El monto debe ser un número mayor a 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Concatenar concepto con referencia si existe
    const descripcionCompleta = formData.referencia
      ? `${formData.concepto.trim()} (Ref: ${formData.referencia.trim()})`
      : formData.concepto.trim();

    const success = await registrarGasto({
      tipo: TipoMovimiento.EGRESO,
      origen: OrigenMovimiento.GASTO,
      descripcion: descripcionCompleta,
      monto: parseFloat(formData.monto),
      metodoPago: formData.metodoPago,
    });

    if (success) {
      onSuccess?.();
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      concepto: '',
      monto: '',
      metodoPago: MetodoPagoCaja.EFECTIVO,
      referencia: '',
    });
    setValidationErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Gasto / Retiro"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {/* Descripción */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Minus className="text-orange-600" size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Registrar Egreso</h4>
              <p className="text-sm text-gray-600">
                Gastos, retiros o egresos manuales de caja
              </p>
            </div>
          </div>
        </div>

        {/* Campo: Concepto */}
        <div className="mb-4">
          <label
            htmlFor="concepto"
            className="block text-sm font-bold text-black mb-2"
          >
            Concepto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="concepto"
            name="concepto"
            value={formData.concepto}
            onChange={handleChange}
            placeholder="Ej: Pago de servicios, Compra de insumos..."
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400 ${
              validationErrors.concepto
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            aria-describedby={validationErrors.concepto ? 'concepto-error' : undefined}
            aria-invalid={!!validationErrors.concepto}
            autoFocus
          />
          {validationErrors.concepto && (
            <p id="concepto-error" className="mt-1 text-sm text-red-600" role="alert">
              {validationErrors.concepto}
            </p>
          )}
        </div>

        {/* Campo: Monto */}
        <div className="mb-4">
          <label
            htmlFor="monto"
            className="block text-sm font-bold text-black mb-2"
          >
            Monto <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="monto"
            name="monto"
            value={formData.monto}
            onChange={handleChange}
            onFocus={(e) => e.target.select()}
            step="0.01"
            min="0"
            placeholder="0.00"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400 ${
              validationErrors.monto
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            aria-describedby={validationErrors.monto ? 'monto-gasto-error' : undefined}
            aria-invalid={!!validationErrors.monto}
          />
          {validationErrors.monto && (
            <p id="monto-gasto-error" className="mt-1 text-sm text-red-600" role="alert">
              {validationErrors.monto}
            </p>
          )}
        </div>

        {/* Campo: Método de Pago */}
        <div className="mb-4">
          <label
            htmlFor="metodoPago"
            className="block text-sm font-bold text-black mb-2"
          >
            Método de Pago
          </label>
          <select
            id="metodoPago"
            name="metodoPago"
            value={formData.metodoPago}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
          >
            {Object.values(MetodoPagoCaja).map((metodo) => (
              <option key={metodo} value={metodo}>
                {METODO_PAGO_LABELS[metodo]}
              </option>
            ))}
          </select>
        </div>

        {/* Campo: Referencia (Opcional) */}
        <div className="mb-6">
          <label
            htmlFor="referencia"
            className="block text-sm font-bold text-black mb-2"
          >
            Referencia (Opcional)
          </label>
          <input
            type="text"
            id="referencia"
            name="referencia"
            value={formData.referencia}
            onChange={handleChange}
            placeholder="Ej: Factura #123, Boleta, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Footer con Botones */}
        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar Gasto'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
