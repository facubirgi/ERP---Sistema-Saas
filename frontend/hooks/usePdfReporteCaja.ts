import { useState, useCallback } from 'react';
import { CajaApi } from '@/lib/api';
import type {
  ReporteDiarioResponse,
  MovimientoCaja,
} from '@/lib/types/caja.types';
import { METODO_PAGO_LABELS } from '@/lib/types/caja.types';

/**
 * Hook para generar reportes PDF de caja
 *
 * Responsabilidades:
 * - Obtener datos del reporte diario del backend
 * - Generar PDF con jsPDF
 * - Disparar descarga o impresión
 *
 * Nota: Requiere instalar: npm install jspdf jspdf-autotable
 *
 * @example
 * ```tsx
 * const { generarPdf, descargarPdf, imprimirPdf, loading } = usePdfReporteCaja();
 *
 * <button onClick={descargarPdf} disabled={loading}>
 *   Descargar Reporte
 * </button>
 * ```
 */
export function usePdfReporteCaja() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene los datos del reporte desde el backend
   * Usa httpOnly cookies para autenticación (no requiere token explícito)
   */
  const obtenerDatos = useCallback(async (): Promise<ReporteDiarioResponse | null> => {
    try {
      const data = await CajaApi.getReporteDiario();
      return data;
    } catch (err: unknown) {
      const error = err as { statusCode?: number };
      if (error.statusCode === 404) {
        setError('No hay sesión de caja activa para generar reporte');
      } else if (error.statusCode === 401) {
        setError('No autenticado. Por favor, inicia sesión.');
      } else {
        setError('Error al obtener datos del reporte');
      }
      console.error(err);
      return null;
    }
  }, []);

  /**
   * Formatea un monto numérico como moneda
   */
  const formatearMonto = (monto: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  /**
   * Formatea una fecha ISO
   */
  const formatearFecha = (fecha: string): string => {
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(fecha));
  };

  /**
   * Genera el PDF (usando importación dinámica para evitar SSR issues)
   * @returns Documento jsPDF o null si hay error
   *
   * NOTA: Requiere instalar las dependencias:
   * npm install jspdf jspdf-autotable
   * npm install -D @types/jspdf-autotable
   */
  const generarPdf = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await obtenerDatos();
      if (!data) return null;

      // Importación dinámica de jsPDF (solo en el cliente)
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();

      // ==================== ENCABEZADO ====================
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DIARIO DE CAJA', 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de Generación: ${formatearFecha(data.horaGeneracion)}`, 105, 28, {
        align: 'center',
      });

      // ==================== DATOS DE LA SESIÓN ====================
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Información de Sesión', 14, 40);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let yPos = 48;

      doc.text(`Apertura: ${formatearFecha(data.sesion.fechaApertura)}`, 14, yPos);
      yPos += 6;
      doc.text(`Monto Inicial: ${formatearMonto(data.sesion.montoInicial)}`, 14, yPos);
      yPos += 6;

      if (data.sesion.fechaCierre) {
        doc.text(`Cierre: ${formatearFecha(data.sesion.fechaCierre)}`, 14, yPos);
        yPos += 6;
        doc.text(`Monto Cierre: ${formatearMonto(data.sesion.montoFinalReal || 0)}`, 14, yPos);
        yPos += 6;

        if (data.sesion.diferencia !== null) {
          const diferencia = data.sesion.diferencia;
          const textoDiferencia =
            diferencia === 0
              ? 'Perfecto (sin diferencia)'
              : diferencia > 0
              ? `Sobrante: ${formatearMonto(diferencia)}`
              : `Faltante: ${formatearMonto(Math.abs(diferencia))}`;

          doc.text(`Diferencia: ${textoDiferencia}`, 14, yPos);
          yPos += 6;
        }
      }

      // ==================== TOTALES ====================
      yPos += 4;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Totales', 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Ingresos: ${formatearMonto(data.totales.totalIngresos)}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Egresos: ${formatearMonto(data.totales.totalEgresos)}`, 14, yPos);
      yPos += 6;
      doc.text(`Saldo Efectivo: ${formatearMonto(data.totales.saldoEfectivo)}`, 14, yPos);
      yPos += 6;
      doc.text(
        `Saldo Otros Métodos: ${formatearMonto(data.totales.saldoOtrosMetodos)}`,
        14,
        yPos
      );
      yPos += 6;

      doc.setFont('helvetica', 'bold');
      doc.text(`Saldo Total: ${formatearMonto(data.totales.saldoTotal)}`, 14, yPos);
      yPos += 10;

      // ==================== RESUMEN POR MÉTODO ====================
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen por Método de Pago', 14, yPos);
      yPos += 8;

      const resumenData = data.resumenPorMetodo.map((item) => [
        METODO_PAGO_LABELS[item.metodo] || item.metodo,
        formatearMonto(item.totalIngresos),
        formatearMonto(item.totalEgresos),
        formatearMonto(item.saldo),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Método', 'Ingresos', 'Egresos', 'Saldo']],
        body: resumenData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 9 },
      });

      yPos = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos) + 10;

      // ==================== MOVIMIENTOS ====================
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Movimientos (${data.movimientos.length})`, 14, yPos);
      yPos += 8;

      const movimientosData = data.movimientos.map((mov: MovimientoCaja) => {
        const hora = new Intl.DateTimeFormat('es-BO', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(mov.fecha));

        return [
          hora,
          mov.descripcion,
          METODO_PAGO_LABELS[mov.metodoPago] || mov.metodoPago,
          mov.tipo,
          formatearMonto(mov.monto),
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Hora', 'Concepto', 'Método', 'Tipo', 'Monto']],
        body: movimientosData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 60 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30, halign: 'right' },
        },
      });

      // ==================== PIE DE PÁGINA ====================
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      return doc;
    } catch (err) {
      setError('Error al generar PDF');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [obtenerDatos]);

  /**
   * Genera y descarga el PDF
   */
  const descargarPdf = useCallback(async () => {
    const doc = await generarPdf();
    if (doc) {
      const fechaHoy = new Date().toISOString().split('T')[0];
      doc.save(`reporte-caja-${fechaHoy}.pdf`);
    }
  }, [generarPdf]);

  /**
   * Genera y abre diálogo de impresión
   */
  const imprimirPdf = useCallback(async () => {
    const doc = await generarPdf();
    if (doc) {
      // Abre el PDF en una nueva ventana para imprimir
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
          // Liberar el objeto URL después de un tiempo para evitar memory leaks
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
        });
      } else {
        // Si no se pudo abrir la ventana, liberar el URL inmediatamente
        URL.revokeObjectURL(pdfUrl);
      }
    }
  }, [generarPdf]);

  return {
    generarPdf,
    descargarPdf,
    imprimirPdf,
    loading,
    error,
  };
}
