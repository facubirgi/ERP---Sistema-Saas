'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { CajaApi } from '@/lib/api';
import { useAuth } from './AuthContext';
import {
  CajaSesion,
  MovimientoCaja,
  AbrirCajaDto,
  CerrarCajaDto,
  RegistrarMovimientoDto,
  MetodoPagoCaja,
  OrigenMovimiento,
} from '@/lib/types/caja.types';

// ==================== HELPER: Calcular Totales ====================

interface Totales {
  totalIngresos: number;
  totalEgresos: number;
  saldoEfectivo: number;
  saldoOtrosMetodos: number;
  saldoTotal: number;
}

function calcularTotales(sesion: CajaSesion | null, movimientos: MovimientoCaja[]): Totales {
  if (!sesion) {
    return {
      totalIngresos: 0,
      totalEgresos: 0,
      saldoEfectivo: 0,
      saldoOtrosMetodos: 0,
      saldoTotal: 0,
    };
  }

  let totalIngresos = sesion.montoInicial;
  let totalEgresos = 0;
  let saldoEfectivo = sesion.montoInicial;
  let saldoOtrosMetodos = 0;

  movimientos.forEach((mov) => {
    // IMPORTANTE: Excluir movimientos de APERTURA porque el montoInicial ya los incluye
    // Si no hacemos esto, el saldo se duplica (montoInicial + movimiento de apertura)
    if (mov.origen === OrigenMovimiento.APERTURA) {
      return; // Skip este movimiento
    }

    // Asegurar que el monto sea un número válido
    const montoNumerico = typeof mov.monto === 'number' ? mov.monto : parseFloat(String(mov.monto)) || 0;

    if (mov.tipo === 'INGRESO') {
      totalIngresos += montoNumerico;
      if (mov.metodoPago === MetodoPagoCaja.EFECTIVO) {
        saldoEfectivo += montoNumerico;
      } else {
        saldoOtrosMetodos += montoNumerico;
      }
    } else {
      totalEgresos += montoNumerico;
      if (mov.metodoPago === MetodoPagoCaja.EFECTIVO) {
        saldoEfectivo -= montoNumerico;
      } else {
        saldoOtrosMetodos -= montoNumerico;
      }
    }
  });

  return {
    totalIngresos,
    totalEgresos,
    saldoEfectivo,
    saldoOtrosMetodos,
    saldoTotal: saldoEfectivo + saldoOtrosMetodos,
  };
}

// ==================== TIPOS DEL CONTEXTO ====================

interface CajaContextType {
  // ESTADO
  sesion: CajaSesion | null;
  movimientos: MovimientoCaja[];
  totales: Totales;
  loading: boolean;
  error: string | null;

  // CRUD - SESIÓN
  fetchSesionActual: () => Promise<void>;
  abrirCaja: (data: AbrirCajaDto) => Promise<CajaSesion | null>;
  cerrarCaja: (data: CerrarCajaDto) => Promise<CajaSesion | null>;

  // CRUD - MOVIMIENTOS
  registrarMovimiento: (data: RegistrarMovimientoDto) => Promise<MovimientoCaja | null>;
  fetchMovimientos: () => Promise<MovimientoCaja[] | null>;

  // UTILIDADES
  clearError: () => void;
}

const CajaContext = createContext<CajaContextType | undefined>(undefined);

// ==================== PROVIDER ====================

export function CajaProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  // Estado local
  const [sesion, setSesion] = useState<CajaSesion | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Totales calculados
  const totales = useMemo(() => calcularTotales(sesion, movimientos), [sesion, movimientos]);

  // ==================== HELPERS ====================

  const checkAuth = useCallback((): boolean => {
    if (!isAuthenticated) {
      setError('No autenticado');
      return false;
    }
    return true;
  }, [isAuthenticated]);

  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    if (err && typeof err === 'object' && 'message' in err) {
      setError(err.message as string);
    } else {
      setError(defaultMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==================== CRUD - SESIÓN ====================

  const fetchSesionActual = useCallback(async () => {
    if (!checkAuth()) return;

    setLoading(true);
    setError(null);

    try {
      const sesionData = await CajaApi.getSesionActual();

      setSesion(sesionData);

      if (sesionData) {
        // Si hay sesión, cargar movimientos
        const movs = await CajaApi.getMovimientos(sesionData.id);
        setMovimientos(movs);
      } else {
        setMovimientos([]);
      }
    } catch (err: unknown) {
      handleError(err, 'Error al obtener sesión actual');
    } finally {
      setLoading(false);
    }
  }, [checkAuth, handleError]);

  const abrirCaja = useCallback(
    async (data: AbrirCajaDto) => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const nuevaSesion = await CajaApi.abrirCaja(data);
        setSesion(nuevaSesion);
        setMovimientos([]);
        return nuevaSesion;
      } catch (err) {
        handleError(err, 'Error al abrir caja');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const cerrarCaja = useCallback(
    async (data: CerrarCajaDto) => {
      if (!checkAuth() || !sesion) return null;

      setLoading(true);
      setError(null);

      try {
        const sesionCerrada = await CajaApi.cerrarCaja(sesion.id, data);
        setSesion(sesionCerrada);
        return sesionCerrada;
      } catch (err) {
        handleError(err, 'Error al cerrar caja');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sesion, checkAuth, handleError]
  );

  // ==================== CRUD - MOVIMIENTOS ====================

  const registrarMovimiento = useCallback(
    async (data: RegistrarMovimientoDto) => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const movimiento = await CajaApi.registrarMovimiento(data);
        setMovimientos((prev) => [movimiento, ...prev]);
        return movimiento;
      } catch (err) {
        handleError(err, 'Error al registrar movimiento');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const fetchMovimientos = useCallback(async () => {
    if (!checkAuth() || !sesion) return null;

    setLoading(true);
    setError(null);

    try {
      const movs = await CajaApi.getMovimientos(sesion.id);
      setMovimientos(movs);
      return movs;
    } catch (err) {
      handleError(err, 'Error al obtener movimientos');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sesion, checkAuth, handleError]);

  // ==================== VALOR DEL CONTEXTO ====================

  const value = useMemo(
    () => ({
      sesion,
      movimientos,
      totales,
      loading,
      error,
      fetchSesionActual,
      abrirCaja,
      cerrarCaja,
      registrarMovimiento,
      fetchMovimientos,
      clearError,
    }),
    [
      sesion,
      movimientos,
      totales,
      loading,
      error,
      fetchSesionActual,
      abrirCaja,
      cerrarCaja,
      registrarMovimiento,
      fetchMovimientos,
      clearError,
    ]
  );

  return <CajaContext.Provider value={value}>{children}</CajaContext.Provider>;
}

// ==================== HOOK PERSONALIZADO ====================

export function useCajaContext(): CajaContextType {
  const context = useContext(CajaContext);
  if (!context) {
    throw new Error('useCajaContext debe usarse dentro de CajaProvider');
  }
  return context;
}
