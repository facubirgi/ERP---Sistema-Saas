'use client';

// ============================================================================
// COBRO FORM MODAL - Formulario para Registrar Cobros de Deudas
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, DollarSign, CreditCard, AlertCircle, User, FileText, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { useVentas } from '@/contexts/VentasContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { MetodoPago, type VentaListItemDto, type RegistrarCobroDto } from '@/lib/types/ventas.types';
import { validateAmount } from '@/lib/utils/validation.utils';
import { formatCurrency } from '@/lib/utils/format.utils';

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
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Ref para el comprobante
  const comprobanteRef = useRef<HTMLDivElement>(null);

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
  // FUNCIONES DE IMPRESIÓN Y PDF
  // ============================================================================

  const handleImprimirComprobante = useCallback(() => {
    if (!comprobanteRef.current) return;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        return;
      }

      const content = comprobanteRef.current.innerHTML;

      printWindow.document.write('<!DOCTYPE html>');
      printWindow.document.write('<html><head>');
      printWindow.document.write('<meta charset="utf-8">');
      printWindow.document.write('<title>Comprobante de Cobro</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(content);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        try {
          printWindow.print();
          printWindow.close();
        } catch (err) {
        }
      }, 250);
    } catch (error) {
    }
  }, []);

  const handleDescargarPDF = useCallback(() => {
    if (!venta) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;
      const montoNum = parseFloat(formData.monto) || 0;

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPROBANTE DE COBRO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Nombre de la empresa
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(user?.razonSocial || 'Mi Empresa', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Fecha
      const fecha = new Date();
      const fechaFormateada = fecha.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      doc.setFontSize(10);
      doc.text(`Fecha: ${fechaFormateada}`, margin, yPosition);
      yPosition += 6;

      // Cliente
      doc.text(`Cliente: ${venta.tercero?.nombre || 'Venta Anónima'}`, margin, yPosition);
      yPosition += 10;

      // Línea separadora
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Información de la venta
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DEL COBRO', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de la Venta: ${formatCurrency(venta.total)}`, margin, yPosition);
      yPosition += 6;

      doc.text(`Saldo Anterior: ${formatCurrency(venta.saldoPendiente)}`, margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'bold');
      doc.text(`Monto Cobrado: ${formatCurrency(montoNum)}`, margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.text(`Método de Pago: ${getMetodoPagoLabel(formData.metodoPago)}`, margin, yPosition);
      yPosition += 10;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Saldo restante
      const saldoRestante = calcularSaldoRestante();
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Saldo Restante: ${formatCurrency(saldoRestante)}`, margin, yPosition);
      yPosition += 10;

      if (saldoRestante === 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text('✓ Deuda totalmente saldada', margin, yPosition);
        yPosition += 10;
      }

      // Línea separadora
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Pie de página
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.text('¡Gracias por su pago!', pageWidth / 2, yPosition, { align: 'center' });

      // Guardar el PDF
      const fechaArchivo = new Date().toISOString().split('T')[0];
      doc.save(`comprobante_cobro_${fechaArchivo}.pdf`);

      addNotification({
        type: 'success',
        title: 'PDF Generado',
        message: 'El comprobante se ha descargado correctamente',
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo generar el PDF',
        duration: 5000,
      });
    }
  }, [venta, formData.monto, formData.metodoPago, addNotification, calcularSaldoRestante]);

  // Función helper para etiquetas de método de pago
  const getMetodoPagoLabel = (metodo: MetodoPago): string => {
    const labels = {
      [MetodoPago.EFECTIVO]: 'Efectivo',
      [MetodoPago.QR]: 'QR',
      [MetodoPago.TARJETA]: 'Tarjeta',
      [MetodoPago.TRANSFERENCIA]: 'Transferencia',
    };
    return labels[metodo];
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
            <div className="space-y-3 pt-4">
              {/* Botones de impresión (solo si pago completo) */}
              {pagoCompleto && formData.monto && !isNaN(parseFloat(formData.monto)) && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleImprimirComprobante}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    aria-label="Imprimir comprobante"
                  >
                    <Printer size={16} />
                    <span>Imprimir</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDescargarPDF}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    aria-label="Descargar PDF"
                  >
                    <Download size={16} />
                    <span>PDF</span>
                  </button>
                </div>
              )}
              
              {/* Botones principales */}
              <div className="flex gap-3">
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
            </div>
          </form>

          {/* Comprobante (oculto, solo para impresión) */}
          <div ref={comprobanteRef} style={{ display: 'none' }}>
            <div style={{ fontFamily: 'Arial, sans-serif', padding: '20mm', maxWidth: '210mm', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                  COMPROBANTE DE COBRO
                </h1>
                <p style={{ fontSize: '14px', margin: '0', color: '#666' }}>{user?.razonSocial || 'Mi Empresa'}</p>
              </div>

              <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '10px 0', marginBottom: '20px' }}>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>
                  <strong>Fecha:</strong> {new Date().toLocaleString('es-AR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>
                  <strong>Cliente:</strong> {venta?.tercero?.nombre || 'Venta Anónima'}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>DETALLE DEL COBRO</h2>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Total de la Venta:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(venta?.total || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Saldo Anterior:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                        {formatCurrency(venta?.saldoPendiente || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Monto Cobrado:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>
                        {formatCurrency(parseFloat(formData.monto) || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Método de Pago:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                        {getMetodoPagoLabel(formData.metodoPago)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 8px', borderBottom: '2px solid #000', fontWeight: 'bold', fontSize: '14px' }}>
                        Saldo Restante:
                      </td>
                      <td style={{ padding: '12px 8px', borderBottom: '2px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: calcularSaldoRestante() === 0 ? '#16a34a' : '#dc2626' }}>
                        {formatCurrency(calcularSaldoRestante())}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {calcularSaldoRestante() === 0 && (
                  <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', fontWeight: 'bold', color: '#16a34a' }}>
                    ✓ Deuda totalmente saldada
                  </p>
                )}
              </div>

              <div style={{ borderTop: '2px solid #000', paddingTop: '15px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontStyle: 'italic', margin: '0' }}>¡Gracias por su pago!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
