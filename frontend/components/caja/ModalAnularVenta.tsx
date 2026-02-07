import { useState, useEffect } from 'react';
import { AlertTriangle, Package, User, DollarSign, Loader2 } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { VentasApi } from '@/lib/api/ventas.api';
import { useCaja } from '@/hooks/useCaja';
import type { MovimientoCaja } from '@/lib/types/caja.types';
import type { DetalleVentaResponseDto, AnularVentaResponseDto } from '@/lib/types/ventas.types';
import toast from 'react-hot-toast';

interface ModalAnularVentaProps {
  isOpen: boolean;
  onClose: () => void;
  movimiento: MovimientoCaja | null;
  onSuccess?: (response: AnularVentaResponseDto) => void;
}

const MIN_MOTIVO_LENGTH = 10;
const MAX_MOTIVO_LENGTH = 500;

/**
 * Componente ModalAnularVenta
 *
 * Modal para anular una venta desde la sección de Caja
 *
 * Características:
 * - Carga y muestra detalle de la venta al abrir
 * - Muestra cliente, total e items de la venta
 * - Campo textarea para motivo obligatorio (mín. 10 caracteres)
 * - Validaciones frontend antes de enviar
 * - Confirmación visual de acción destructiva
 *
 * Flujo:
 * 1. Usuario click en "Anular" en tabla de movimientos
 * 2. Modal carga detalle de la venta
 * 3. Usuario escribe motivo de anulación
 * 4. Confirma la anulación
 * 5. Backend ejecuta transacción atómica (soft delete, revertir stock, etc.)
 * 6. Se actualizan los movimientos de caja
 */
export function ModalAnularVenta({
  isOpen,
  onClose,
  movimiento,
  onSuccess,
}: ModalAnularVentaProps) {
  const { refrescarSesion } = useCaja();

  const [detalleVenta, setDetalleVenta] = useState<DetalleVentaResponseDto | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cargar detalle de la venta cuando se abre el modal
  useEffect(() => {
    if (isOpen && movimiento?.comprobanteId) {
      cargarDetalleVenta(movimiento.comprobanteId);
    }
  }, [isOpen, movimiento?.comprobanteId]);

  const cargarDetalleVenta = async (comprobanteId: string) => {
    setLoadingDetalle(true);
    setErrorDetalle(null);

    try {
      const detalle = await VentasApi.getById(comprobanteId);
      setDetalleVenta(detalle);
    } catch (error) {
      console.error('Error al cargar detalle de venta:', error);
      setErrorDetalle('No se pudo cargar el detalle de la venta');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const formatearMonto = (monto: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const handleMotivoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMotivoAnulacion(value);

    // Limpiar error al editar
    if (validationError) {
      setValidationError(null);
    }
  };

  const validate = (): boolean => {
    const trimmedMotivo = motivoAnulacion.trim();

    if (!trimmedMotivo) {
      setValidationError('El motivo de anulación es obligatorio');
      return false;
    }

    if (trimmedMotivo.length < MIN_MOTIVO_LENGTH) {
      setValidationError(`El motivo debe tener al menos ${MIN_MOTIVO_LENGTH} caracteres`);
      return false;
    }

    if (trimmedMotivo.length > MAX_MOTIVO_LENGTH) {
      setValidationError(`El motivo no puede exceder ${MAX_MOTIVO_LENGTH} caracteres`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!movimiento?.comprobanteId) {
      toast.error('No se encontró el comprobante asociado');
      return;
    }

    if (!validate()) return;

    setSubmitting(true);

    try {
      const response = await VentasApi.anularVenta(movimiento.comprobanteId, {
        motivoAnulacion: motivoAnulacion.trim(),
      });

      toast.success(response.mensaje || 'Venta anulada exitosamente');

      // Recargar datos de caja para reflejar los cambios
      await refrescarSesion();

      onSuccess?.(response);
      handleClose();
    } catch (error: unknown) {
      console.error('Error al anular venta:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error al anular la venta';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDetalleVenta(null);
    setMotivoAnulacion('');
    setValidationError(null);
    setErrorDetalle(null);
    onClose();
  };

  const caracteresRestantes = MAX_MOTIVO_LENGTH - motivoAnulacion.length;
  const caracteresActuales = motivoAnulacion.trim().length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Anular Venta"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {/* Advertencia */}
        <div className="mb-6">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-red-900">Atención: Acción Irreversible</h4>
              <p className="text-sm text-red-700 mt-1">
                Esta acción anulará la venta, revertirá el stock de los productos y
                registrará un egreso de devolución en caja.
              </p>
            </div>
          </div>
        </div>

        {/* Detalle de la Venta */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Detalle de la Venta</h4>

          {loadingDetalle ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={32} />
              <span className="ml-2 text-gray-600">Cargando detalle...</span>
            </div>
          ) : errorDetalle ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">{errorDetalle}</p>
            </div>
          ) : detalleVenta ? (
            <div className="space-y-3">
              {/* Cliente */}
              <div className="flex items-center gap-2 text-gray-700">
                <User size={18} className="text-gray-400" />
                <span className="font-medium">Cliente:</span>
                <span>{detalleVenta.tercero?.nombre || 'Venta anónima'}</span>
              </div>

              {/* Total */}
              <div className="flex items-center gap-2 text-gray-700">
                <DollarSign size={18} className="text-gray-400" />
                <span className="font-medium">Total:</span>
                <span className="text-lg font-bold text-red-600">
                  {formatearMonto(detalleVenta.total)}
                </span>
              </div>

              {/* Items */}
              <div className="mt-3">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Package size={18} className="text-gray-400" />
                  <span className="font-medium">
                    Productos ({detalleVenta.detalles.length}):
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <ul className="space-y-1 text-sm">
                    {detalleVenta.detalles.map((detalle) => (
                      <li key={detalle.id} className="flex justify-between text-gray-600">
                        <span>
                          {detalle.cantidad}x {detalle.nombreProducto}
                        </span>
                        <span className="font-medium">
                          {formatearMonto(detalle.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-600">No se encontró información de la venta</p>
            </div>
          )}
        </div>

        {/* Campo: Motivo de Anulación */}
        <div className="mb-6">
          <label
            htmlFor="motivoAnulacion"
            className="block text-sm font-bold text-black mb-2"
          >
            Motivo de Anulación <span className="text-red-500">*</span>
          </label>
          <textarea
            id="motivoAnulacion"
            name="motivoAnulacion"
            value={motivoAnulacion}
            onChange={handleMotivoChange}
            placeholder="Ej: Cliente devolvió el producto por defecto de fábrica..."
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-400 resize-none ${
              validationError ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-describedby={validationError ? 'motivo-error' : 'motivo-hint'}
            aria-invalid={!!validationError}
            autoFocus
          />
          <div className="flex justify-between mt-1">
            <div>
              {validationError ? (
                <p id="motivo-error" className="text-sm text-red-600" role="alert">
                  {validationError}
                </p>
              ) : (
                <p id="motivo-hint" className="text-sm text-gray-500">
                  Mínimo {MIN_MOTIVO_LENGTH} caracteres
                </p>
              )}
            </div>
            <p
              className={`text-sm ${
                caracteresRestantes < 50 ? 'text-yellow-600' : 'text-gray-500'
              }`}
            >
              {caracteresActuales}/{MAX_MOTIVO_LENGTH}
            </p>
          </div>
        </div>

        {/* Footer con Botones */}
        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || loadingDetalle || !detalleVenta}
          >
            {submitting ? 'Anulando...' : 'Confirmar Anulación'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
