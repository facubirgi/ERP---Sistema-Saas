import { useState, useCallback } from 'react';
import { VentasApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { ExportarCobrosResponseDto, MetodoPago } from '@/lib/types/ventas.types';

/**
 * Hook para exportar cobros de la sesión de caja a Excel
 *
 * Responsabilidades:
 * - Obtener datos de cobros del endpoint /api/ventas/cobros/export
 * - Generar archivo Excel con formato profesional
 * - Disparar descarga del archivo
 *
 * Nota: Requiere que haya una sesión de caja ABIERTA
 *
 * @example
 * ```tsx
 * const { exportarCobros, loading, error } = useExportarCobros();
 *
 * <button onClick={exportarCobros} disabled={loading}>
 *   {loading ? 'Exportando...' : 'Exportar Cobros (Excel)'}
 * </button>
 * ```
 */
export interface UseExportarCobrosReturn {
  exportarCobros: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useExportarCobros(): UseExportarCobrosReturn {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene los datos de cobros desde el backend
   */
  const obtenerDatos = useCallback(async (): Promise<ExportarCobrosResponseDto | null> => {
    if (!isAuthenticated) {
      setError('No autenticado');
      return null;
    }

    try {
      // Las llamadas API usan httpOnly cookies automáticamente con credentials: 'include'
      const data = await VentasApi.exportarCobros();
      return data;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      if (error.statusCode === 400 || error.message?.includes('caja abierta')) {
        setError('No hay sesión de caja abierta para exportar cobros');
      } else {
        setError('Error al obtener datos de cobros');
      }
      return null;
    }
  }, [isAuthenticated]);

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
   * Formatea una fecha ISO a formato legible
   */
  const formatearFecha = (fecha: Date | string): string => {
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(fecha));
  };

  /**
   * Traduce el método de pago a español
   */
  const traducirMetodoPago = (metodo: MetodoPago): string => {
    const traducciones: Record<MetodoPago, string> = {
      EFECTIVO: 'Efectivo',
      QR: 'QR',
      TARJETA: 'Tarjeta',
      TRANSFERENCIA: 'Transferencia',
    };
    return traducciones[metodo] || metodo;
  };

  /**
   * Genera y descarga el archivo Excel
   */
  const exportarCobros = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await obtenerDatos();
      if (!data) return;

      // Importación dinámica de xlsx (solo en el cliente)
      const XLSX = await import('xlsx');

      // ==================== HOJA 1: COBROS ====================

      // Encabezado de la hoja
      const cobrosData: (string | number)[][] = [
        ['REPORTE DE COBROS - SESIÓN DE CAJA'],
        [],
        ['Fecha de Apertura:', formatearFecha(data.sesion.fechaApertura)],
        ['Fecha de Consulta:', formatearFecha(data.sesion.fechaConsulta)],
        ['Estado:', data.sesion.estado],
        [],
        ['N°', 'Fecha', 'Cliente', 'Comprobante ID', 'Total Comprobante', 'Monto Cobrado', 'Método de Pago'],
      ];

      // Agregar cobros
      if (data.cobros && data.cobros.length > 0) {
        data.cobros.forEach((cobro, index) => {
          cobrosData.push([
            index + 1,
            formatearFecha(cobro.fecha),
            cobro.cliente?.nombre || 'Anónimo',
            cobro.comprobante.id.substring(0, 8) + '...',
            cobro.comprobante.total,
            cobro.monto,
            traducirMetodoPago(cobro.metodo),
          ]);
        });
      }

      // Espacio
      cobrosData.push([]);

      // Totales
      cobrosData.push([
        '',
        '',
        '',
        '',
        'TOTAL COBROS:',
        data.resumen.totalCobros,
        '',
      ]);
      cobrosData.push([
        '',
        '',
        '',
        '',
        'MONTO TOTAL:',
        formatearMonto(data.resumen.totalMonto),
        '',
      ]);

      // ==================== HOJA 2: RESUMEN POR MÉTODO ====================

      const resumenData: (string | number)[][] = [
        ['RESUMEN POR MÉTODO DE PAGO'],
        [],
        ['Método', 'Monto Total'],
        ['Efectivo', data.resumen.porMetodo?.EFECTIVO || 0],
        ['QR', data.resumen.porMetodo?.QR || 0],
        ['Tarjeta', data.resumen.porMetodo?.TARJETA || 0],
        ['Transferencia', data.resumen.porMetodo?.TRANSFERENCIA || 0],
        [],
        ['TOTAL GENERAL:', formatearMonto(data.resumen.totalMonto)],
      ];

      // ==================== CREAR LIBRO DE EXCEL ====================

      const wb = XLSX.utils.book_new();

      // Hoja de Cobros
      const wsCobros = XLSX.utils.aoa_to_sheet(cobrosData);

      // Ancho de columnas
      wsCobros['!cols'] = [
        { wch: 5 },   // N°
        { wch: 18 },  // Fecha
        { wch: 25 },  // Cliente
        { wch: 15 },  // Comprobante ID
        { wch: 18 },  // Total Comprobante
        { wch: 18 },  // Monto Cobrado
        { wch: 18 },  // Método de Pago
      ];

      // Hoja de Resumen
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);

      // Ancho de columnas
      wsResumen['!cols'] = [
        { wch: 20 },  // Método
        { wch: 18 },  // Monto Total
      ];

      // Agregar hojas al libro
      XLSX.utils.book_append_sheet(wb, wsCobros, 'Cobros');
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

      // ==================== DESCARGAR ARCHIVO ====================

      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `cobros-caja-${fechaHoy}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

    } catch (err: unknown) {
      setError('Error al generar archivo Excel');
    } finally {
      setLoading(false);
    }
  }, [obtenerDatos]);

  return {
    exportarCobros,
    loading,
    error,
  };
}
