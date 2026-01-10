import { useState, useMemo } from 'react';
import { Lock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useCaja } from '@/hooks/useCaja';
import { useExportarCobros } from '@/hooks/useExportarCobros';

interface ModalCierreProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  saldoEsperadoEfectivo: number;
}

/**
 * Componente ModalCierre (COMPONENTE CRÍTICO)
 *
 * Modal para cerrar sesión de caja (arqueo)
 *
 * Flujo UX en 3 pasos:
 * 1. Mostrar saldo esperado en efectivo (calculado por el sistema)
 * 2. Input para que el usuario ingrese el saldo real (contado físicamente)
 * 3. Calcular y mostrar diferencia en tiempo real con colores semánticos:
 *    - Verde (Perfecto): Diferencia = 0
 *    - Rojo (Faltante): Diferencia < 0
 *    - Amarillo (Sobrante): Diferencia > 0
 *
 * Este componente es crítico porque:
 * - Garantiza la integridad financiera
 * - Detecta faltantes o sobrantes
 * - Proporciona feedback visual inmediato
 * - Previene errores de conteo
 */
export function ModalCierre({
  isOpen,
  onClose,
  onSuccess,
  saldoEsperadoEfectivo,
}: ModalCierreProps) {
  const { cerrarCaja, formatearMonto, calcularDiferencia, loading } = useCaja();
  const { exportarCobros } = useExportarCobros();

  const [montoCierre, setMontoCierre] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // ==================== CÁLCULOS EN TIEMPO REAL ====================

  const montoReal = useMemo(() => {
    return montoCierre ? parseFloat(montoCierre) : null;
  }, [montoCierre]);

  const diferencia = useMemo(() => {
    if (montoReal === null) return null;
    return calcularDiferencia(saldoEsperadoEfectivo, montoReal);
  }, [montoReal, saldoEsperadoEfectivo, calcularDiferencia]);

  const estadoDiferencia = useMemo<
    'perfecto' | 'faltante' | 'sobrante' | null
  >(() => {
    if (diferencia === null) return null;
    if (diferencia === 0) return 'perfecto';
    if (diferencia < 0) return 'faltante';
    return 'sobrante';
  }, [diferencia]);

  // ==================== ESTILOS DINÁMICOS ====================

  const diferenciaStyles = {
    perfecto: {
      icon: <CheckCircle2 className="text-green-600" size={24} />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      label: 'Perfecto',
      description: 'El monto coincide exactamente',
    },
    faltante: {
      icon: <XCircle className="text-red-600" size={24} />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      label: 'Faltante',
      description: 'Hay menos efectivo del esperado',
    },
    sobrante: {
      icon: <AlertTriangle className="text-yellow-600" size={24} />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      label: 'Sobrante',
      description: 'Hay más efectivo del esperado',
    },
  };

  // ==================== HANDLERS ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validaciones
    if (montoReal === null || isNaN(montoReal) || montoReal < 0) {
      setValidationError('Ingresa un monto válido (0 o mayor)');
      return;
    }

    // 1. Exportar cobros ANTES de cerrar la caja
    await exportarCobros();

    // 2. Cerrar caja
    const success = await cerrarCaja({ montoRealEfectivo: montoReal });

    if (success) {
      onSuccess?.();
      handleClose();
    }
  };

  const handleClose = () => {
    setMontoCierre('');
    setValidationError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cerrar Caja - Arqueo"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {/* Advertencia */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <Lock className="text-red-600 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Acción Irreversible
            </p>
            <p className="text-sm text-red-700 mt-1">
              Una vez cerrada la caja, no podrás registrar más movimientos para
              esta sesión.
            </p>
          </div>
        </div>

        {/* PASO 1: SALDO ESPERADO */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Saldo Esperado en Efectivo (Sistema)
          </label>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-3xl font-bold text-blue-700">
              {formatearMonto(saldoEsperadoEfectivo)}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Este es el monto que deberías tener en efectivo según los registros
            </p>
          </div>
        </div>

        {/* PASO 2: SALDO REAL (INPUT) */}
        <div className="mb-6">
          <label
            htmlFor="montoCierre"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            ¿Cuánto efectivo contaste físicamente?{' '}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="montoCierre"
            value={montoCierre}
            onChange={(e) => setMontoCierre(e.target.value)}
            onFocus={(e) => e.target.select()}
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder:text-gray-400"
            aria-describedby={validationError ? 'cierre-error' : undefined}
            aria-invalid={!!validationError}
            autoFocus
            required
          />
          {validationError && (
            <p id="cierre-error" className="mt-2 text-sm text-red-600" role="alert">
              {validationError}
            </p>
          )}
        </div>

        {/* PASO 3: DIFERENCIA (DINÁMICO) */}
        {estadoDiferencia && diferencia !== null && (
          <div
            className={`mb-6 p-4 ${diferenciaStyles[estadoDiferencia].bgColor} border-2 ${diferenciaStyles[estadoDiferencia].borderColor} rounded-lg`}
          >
            <div className="flex items-center gap-3 mb-2">
              {diferenciaStyles[estadoDiferencia].icon}
              <div>
                <p
                  className={`font-semibold ${diferenciaStyles[estadoDiferencia].textColor}`}
                >
                  {diferenciaStyles[estadoDiferencia].label}
                </p>
                <p
                  className={`text-sm ${diferenciaStyles[estadoDiferencia].textColor}`}
                >
                  {diferenciaStyles[estadoDiferencia].description}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-current/20">
              <p
                className={`text-sm font-medium ${diferenciaStyles[estadoDiferencia].textColor}`}
              >
                Diferencia:{' '}
                <span className="text-xl font-bold">
                  {diferencia > 0 ? '+' : ''}
                  {formatearMonto(diferencia)}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Nota Final */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Nota:</strong> La diferencia se registrará en el sistema.
            Asegúrate de contar el efectivo cuidadosamente antes de confirmar.
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
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !montoCierre}
          >
            {loading ? 'Cerrando...' : 'Confirmar Cierre'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
