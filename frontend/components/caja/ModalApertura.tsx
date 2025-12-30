import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useCaja } from '@/hooks/useCaja';

interface ModalAperturaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Componente ModalApertura
 *
 * Modal para abrir una nueva sesión de caja
 *
 * Campos:
 * - Monto de apertura (efectivo inicial)
 *
 * Validaciones:
 * - Monto > 0
 * - No permite negativos
 *
 * Flujo:
 * 1. Usuario ingresa monto inicial
 * 2. Confirma apertura
 * 3. Se crea nueva sesión
 * 4. Modal se cierra y vista cambia a "Abierta"
 */
export function ModalApertura({
  isOpen,
  onClose,
  onSuccess,
}: ModalAperturaProps) {
  const { abrirCaja, formatearMonto, loading } = useCaja();

  const [montoApertura, setMontoApertura] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validaciones
    const monto = parseFloat(montoApertura);

    if (isNaN(monto) || monto <= 0) {
      setValidationError('El monto debe ser un número mayor a 0');
      return;
    }

    // Abrir caja
    const success = await abrirCaja({ montoInicial: monto });

    if (success) {
      onSuccess?.();
      handleClose();
    }
  };

  const handleClose = () => {
    setMontoApertura('');
    setValidationError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Abrir Caja" size="md">
      <form onSubmit={handleSubmit}>
        {/* Descripción */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Iniciar Turno de Caja</h4>
              <p className="text-sm text-gray-600">
                Ingresa el monto inicial en efectivo para comenzar
              </p>
            </div>
          </div>
        </div>

        {/* Campo: Monto de Apertura */}
        <div className="mb-6">
          <label
            htmlFor="montoApertura"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Monto de Apertura (Efectivo)
          </label>
          <input
            type="number"
            id="montoApertura"
            value={montoApertura}
            onChange={(e) => setMontoApertura(e.target.value)}
            onFocus={(e) => e.target.select()}
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            aria-describedby={validationError ? 'monto-error' : undefined}
            aria-invalid={!!validationError}
            autoFocus
            required
          />

          {/* Vista Previa Formateada */}
          {montoApertura && !isNaN(parseFloat(montoApertura)) && (
            <p className="mt-2 text-sm text-gray-600">
              Equivale a:{' '}
              <span className="font-semibold text-blue-600">
                {formatearMonto(parseFloat(montoApertura))}
              </span>
            </p>
          )}

          {/* Error de Validación */}
          {validationError && (
            <p id="monto-error" className="mt-2 text-sm text-red-600" role="alert">
              {validationError}
            </p>
          )}
        </div>

        {/* Nota Informativa */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Importante:</strong> Este monto debe coincidir con el efectivo
            físico que tienes en la caja al iniciar el turno.
          </p>
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
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
