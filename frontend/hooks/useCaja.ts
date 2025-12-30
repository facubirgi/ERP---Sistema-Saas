import { useCallback, useMemo } from 'react';
import { useCajaContext } from '@/contexts/CajaContext';
import {
  EstadoCaja,
} from '@/lib/types/caja.types';
import type {
  AbrirCajaDto,
  CerrarCajaDto,
  RegistrarMovimientoDto,
  TotalesCajaResponse,
  CajaSesion,
  MovimientoCaja,
} from '@/lib/types/caja.types';

/**
 * Hook personalizado para gestionar la lógica de negocio del módulo de Caja
 *
 * Responsabilidades:
 * - Proporcionar acceso al estado de la sesión actual
 * - Funciones para abrir/cerrar caja
 * - Registrar movimientos manuales
 * - Calcular totales en tiempo real
 * - Formatear fechas y montos (localización)
 * - Validaciones de negocio
 *
 * @example
 * ```tsx
 * const {
 *   sesion,
 *   esCajaAbierta,
 *   saldoActual,
 *   abrirCaja,
 *   cerrarCaja,
 *   formatearMonto
 * } = useCaja();
 *
 * if (!esCajaAbierta) {
 *   return <VistaCajaCerrada onAbrir={() => abrirCaja({ montoApertura: 100 })} />
 * }
 * ```
 */
export interface UseCajaReturn {
  // ESTADO
  sesion: CajaSesion | null;
  movimientos: MovimientoCaja[];
  totales: TotalesCajaResponse;
  loading: boolean;
  error: string | null;

  // ACCIONES
  abrirCaja: (data: AbrirCajaDto) => Promise<boolean>;
  cerrarCaja: (data: CerrarCajaDto) => Promise<boolean>;
  registrarGasto: (data: RegistrarMovimientoDto) => Promise<boolean>;
  refrescarSesion: () => Promise<void>;

  // UTILIDADES
  esCajaAbierta: boolean;
  saldoActual: number;
  saldoEfectivo: number;
  formatearMonto: (monto: number) => string;
  formatearHora: (fecha: string) => string;
  formatearFechaCompleta: (fecha: string) => string;
  calcularDiferencia: (montoEsperado: number, montoReal: number) => number;
  clearError: () => void;
}

export function useCaja(): UseCajaReturn {
  const {
    sesion,
    movimientos,
    totales,
    loading,
    error,
    abrirCaja: abrirCajaContext,
    cerrarCaja: cerrarCajaContext,
    registrarMovimiento,
    fetchSesionActual,
    clearError: clearErrorContext,
  } = useCajaContext();

  // ==================== ACCIONES ====================

  /**
   * Abre una nueva sesión de caja
   * @param data - Datos de apertura (monto inicial en efectivo)
   * @returns true si la operación fue exitosa
   */
  const abrirCaja = useCallback(
    async (data: AbrirCajaDto): Promise<boolean> => {
      const response = await abrirCajaContext(data);
      return response !== null;
    },
    [abrirCajaContext]
  );

  /**
   * Cierra la sesión actual (arqueo)
   * @param data - Datos de cierre (monto real contado)
   * @returns true si la operación fue exitosa
   */
  const cerrarCaja = useCallback(
    async (data: CerrarCajaDto): Promise<boolean> => {
      const response = await cerrarCajaContext(data);
      return response !== null;
    },
    [cerrarCajaContext]
  );

  /**
   * Registra un movimiento manual (gasto/retiro) y refresca la sesión
   * @param data - Datos del movimiento
   * @returns true si la operación fue exitosa
   */
  const registrarGasto = useCallback(
    async (data: RegistrarMovimientoDto): Promise<boolean> => {
      const response = await registrarMovimiento(data);
      if (response) {
        await fetchSesionActual(); // Refresh para actualizar movimientos y totales
        return true;
      }
      return false;
    },
    [registrarMovimiento, fetchSesionActual]
  );

  /**
   * Refresca los datos de la sesión actual
   */
  const refrescarSesion = useCallback(async () => {
    await fetchSesionActual();
  }, [fetchSesionActual]);

  // ==================== UTILIDADES COMPUTADAS ====================

  /**
   * Indica si hay una caja abierta actualmente
   */
  const esCajaAbierta = useMemo(() => {
    return sesion?.estado === EstadoCaja.ABIERTA;
  }, [sesion]);

  /**
   * Saldo total actual (efectivo + otros métodos)
   */
  const saldoActual = useMemo(() => {
    return totales.saldoTotal;
  }, [totales.saldoTotal]);

  /**
   * Saldo en efectivo (para el arqueo)
   */
  const saldoEfectivo = useMemo(() => {
    return totales.saldoEfectivo;
  }, [totales.saldoEfectivo]);

  // ==================== FORMATEO Y LOCALIZACIÓN ====================

  /**
   * Formatea un monto numérico como moneda local (BOB)
   * @param monto - Monto a formatear
   * @returns Monto formateado con símbolo de moneda
   * @example formatearMonto(1250.50) => "Bs 1.250,50"
   */
  const formatearMonto = useCallback((monto: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(monto);
  }, []);

  /**
   * Formatea una fecha ISO como hora local (HH:MM)
   * @param fecha - Fecha en formato ISO string
   * @returns Hora formateada
   * @example formatearHora("2025-01-25T14:30:00") => "14:30"
   */
  const formatearHora = useCallback((fecha: string): string => {
    return new Intl.DateTimeFormat('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(fecha));
  }, []);

  /**
   * Formatea una fecha ISO como fecha completa con hora
   * @param fecha - Fecha en formato ISO string
   * @returns Fecha completa formateada
   * @example formatearFechaCompleta("2025-01-25T14:30:00") => "25 de enero de 2025, 14:30"
   */
  const formatearFechaCompleta = useCallback((fecha: string): string => {
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(fecha));
  }, []);

  /**
   * Calcula la diferencia entre el monto esperado y el real (arqueo)
   * @param montoEsperado - Saldo calculado por el sistema
   * @param montoReal - Saldo contado físicamente
   * @returns Diferencia (positivo = sobrante, negativo = faltante, 0 = perfecto)
   */
  const calcularDiferencia = useCallback(
    (montoEsperado: number, montoReal: number): number => {
      return montoReal - montoEsperado;
    },
    []
  );

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    clearErrorContext();
  }, [clearErrorContext]);

  // ==================== RETORNO ====================

  return {
    // Estado
    sesion,
    movimientos,
    totales,
    loading,
    error,

    // Acciones
    abrirCaja,
    cerrarCaja,
    registrarGasto,
    refrescarSesion,

    // Utilidades
    esCajaAbierta,
    saldoActual,
    saldoEfectivo,
    formatearMonto,
    formatearHora,
    formatearFechaCompleta,
    calcularDiferencia,
    clearError,
  };
}
