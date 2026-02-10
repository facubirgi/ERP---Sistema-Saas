'use client';

// ============================================================================
// VENTAS CONTEXT - Sistema SaaS
// ============================================================================
// Context para gestión de estado de ventas, cobros y terceros
// Proporciona CRUD completo con manejo de errores y loading states

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { VentasApi, TercerosApi, CobrosApi, CotizacionesApi } from '@/lib/api';
import {
  CrearVentaDto,
  VentaResponseDto,
  DetalleVentaResponseDto,
  ListarVentasQueryDto,
  VentaListItemDto,
  ActualizarComprobanteDto,
  DeudaClienteDto,
  CrearTerceroDto,
  ActualizarTerceroDto,
  TerceroResponseDto,
  ListarTercerosQueryDto,
  RegistrarCobroDto,
  ActualizarCobroDto,
  CobroResponseDto,
  VentasMetricas,
  TipoTercero,
  EstadoPago,
  CrearCotizacionDto,
  CotizacionResponseDto,
  DetalleCotizacionResponseDto,
  CotizacionListItemDto,
  ListarCotizacionesQueryDto,
  ActualizarCotizacionDto,
} from '@/lib/types/ventas.types';
import { useAuth } from './AuthContext';

// ============================================================================
// TIPOS DEL CONTEXT
// ============================================================================

interface VentasContextType {
  // Estado
  ventas: VentaListItemDto[];
  cotizaciones: CotizacionListItemDto[];
  terceros: TerceroResponseDto[];
  loading: boolean;
  error: string | null;

  // Ventas - CRUD
  crearVenta: (data: CrearVentaDto) => Promise<VentaResponseDto | null>;
  fetchVentas: (query?: ListarVentasQueryDto) => Promise<VentaListItemDto[] | null>;
  fetchVentaById: (id: string) => Promise<DetalleVentaResponseDto | null>;
  actualizarComprobante: (id: string, data: ActualizarComprobanteDto) => Promise<DetalleVentaResponseDto | null>;
  getDeudas: (clienteId: string) => Promise<DeudaClienteDto[] | null>;

  // Cotizaciones - CRUD
  crearCotizacion: (data: CrearCotizacionDto) => Promise<CotizacionResponseDto | null>;
  fetchCotizaciones: (query?: ListarCotizacionesQueryDto) => Promise<CotizacionListItemDto[] | null>;
  fetchCotizacionById: (id: string) => Promise<DetalleCotizacionResponseDto | null>;
  actualizarCotizacion: (id: string, data: ActualizarCotizacionDto) => Promise<CotizacionResponseDto | null>;
  eliminarCotizacion: (id: string) => Promise<boolean>;

  // Terceros - CRUD
  crearTercero: (data: CrearTerceroDto) => Promise<TerceroResponseDto | null>;
  fetchTerceros: (query?: ListarTercerosQueryDto) => Promise<TerceroResponseDto[] | null>;
  fetchTerceroById: (id: string) => Promise<TerceroResponseDto | null>;
  actualizarTercero: (id: string, data: ActualizarTerceroDto) => Promise<TerceroResponseDto | null>;
  eliminarTercero: (id: string) => Promise<boolean>;
  getSaldoTercero: (id: string) => Promise<{ clienteNombre: string; saldoTotal: number; estado: 'DEUDOR' | 'AL_DIA' } | null>;

  // Cobros - CRUD
  registrarCobro: (data: RegistrarCobroDto) => Promise<CobroResponseDto | null>;
  actualizarCobro: (id: string, data: ActualizarCobroDto) => Promise<CobroResponseDto | null>;

  // Utilidades
  calcularMetricas: () => VentasMetricas;
  clearError: () => void;
}

const VentasContext = createContext<VentasContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function VentasProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [ventas, setVentas] = useState<VentaListItemDto[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionListItemDto[]>([]);
  const [terceros, setTerceros] = useState<TerceroResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Verifica si el usuario está autenticado
   */
  const checkAuth = useCallback((): boolean => {
    if (!isAuthenticated) {
      setError('No autenticado');
      return false;
    }
    return true;
  }, [isAuthenticated]);

  /**
   * Maneja errores de forma centralizada
   */
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

  // ============================================================================
  // VENTAS
  // ============================================================================

  const crearVenta = useCallback(
    async (data: CrearVentaDto): Promise<VentaResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await VentasApi.create(data);
        // Actualizar lista local con la nueva venta
        await fetchVentas();
        return response;
      } catch (err) {
        handleError(err, 'Error al crear venta');
        return null;
      } finally {
        setLoading(false);
      }
    },
    // fetchVentas es estable y no necesita incluirse como dependencia
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checkAuth, handleError]
  );

  const fetchVentas = useCallback(
    async (query?: ListarVentasQueryDto): Promise<VentaListItemDto[] | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await VentasApi.getAll(query);
        setVentas(response);
        return response;
      } catch (err) {
        handleError(err, 'Error al cargar ventas');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const fetchVentaById = useCallback(
    async (id: string): Promise<DetalleVentaResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const venta = await VentasApi.getById(id);
        return venta;
      } catch (err) {
        handleError(err, 'Error al cargar venta');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const actualizarComprobante = useCallback(
    async (id: string, data: ActualizarComprobanteDto): Promise<DetalleVentaResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const venta = await VentasApi.update(id, data);
        // Actualizar lista local de ventas
        await fetchVentas();
        return venta;
      } catch (err) {
        handleError(err, 'Error al actualizar comprobante');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError, fetchVentas]
  );

  const getDeudas = useCallback(
    async (clienteId: string): Promise<DeudaClienteDto[] | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const deudas = await VentasApi.getDeudas(clienteId);
        return deudas;
      } catch (err) {
        handleError(err, 'Error al cargar deudas');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  // ============================================================================
  // COTIZACIONES
  // ============================================================================

  const crearCotizacion = useCallback(
    async (data: CrearCotizacionDto): Promise<CotizacionResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await CotizacionesApi.create(data);
        // Actualizar lista local con la nueva cotización
        await fetchCotizaciones();
        return response;
      } catch (err) {
        handleError(err, 'Error al crear cotización');
        return null;
      } finally {
        setLoading(false);
      }
    },
    // fetchCotizaciones es estable y no necesita incluirse como dependencia
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checkAuth, handleError]
  );

  const fetchCotizaciones = useCallback(
    async (query?: ListarCotizacionesQueryDto): Promise<CotizacionListItemDto[] | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await CotizacionesApi.getAll(query);
        setCotizaciones(response);
        return response;
      } catch (err) {
        handleError(err, 'Error al cargar cotizaciones');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const fetchCotizacionById = useCallback(
    async (id: string): Promise<DetalleCotizacionResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const cotizacion = await CotizacionesApi.getById(id);
        return cotizacion;
      } catch (err) {
        handleError(err, 'Error al cargar cotización');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const actualizarCotizacion = useCallback(
    async (id: string, data: ActualizarCotizacionDto): Promise<CotizacionResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const cotizacion = await CotizacionesApi.update(id, data);
        // Actualizar lista local de cotizaciones
        await fetchCotizaciones();
        return cotizacion;
      } catch (err) {
        handleError(err, 'Error al actualizar cotización');
        return null;
      } finally {
        setLoading(false);
      }
    },
    // fetchCotizaciones es estable y no necesita incluirse como dependencia
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checkAuth, handleError]
  );

  const eliminarCotizacion = useCallback(
    async (id: string): Promise<boolean> => {
      if (!checkAuth()) return false;

      setLoading(true);
      setError(null);

      try {
        await CotizacionesApi.remove(id);
        setCotizaciones((prev) => prev.filter((c) => c.id !== id));
        return true;
      } catch (err) {
        handleError(err, 'Error al eliminar cotización');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  // ============================================================================
  // TERCEROS
  // ============================================================================

  const crearTercero = useCallback(
    async (data: CrearTerceroDto): Promise<TerceroResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const tercero = await TercerosApi.create(data);
        // Actualizar lista local
        setTerceros((prev) => [tercero, ...prev]);
        return tercero;
      } catch (err) {
        handleError(err, 'Error al crear tercero');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const fetchTerceros = useCallback(
    async (query?: ListarTercerosQueryDto): Promise<TerceroResponseDto[] | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await TercerosApi.getAll(query);
        setTerceros(response);
        return response;
      } catch (err) {
        handleError(err, 'Error al cargar terceros');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const fetchTerceroById = useCallback(
    async (id: string): Promise<TerceroResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const tercero = await TercerosApi.getById(id);
        return tercero;
      } catch (err) {
        handleError(err, 'Error al cargar tercero');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const actualizarTercero = useCallback(
    async (id: string, data: ActualizarTerceroDto): Promise<TerceroResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const tercero = await TercerosApi.update(id, data);
        // Actualizar en lista local
        setTerceros((prev) => prev.map((t) => (t.id === id ? tercero : t)));
        return tercero;
      } catch (err) {
        handleError(err, 'Error al actualizar tercero');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const eliminarTercero = useCallback(
    async (id: string): Promise<boolean> => {
      if (!checkAuth()) return false;

      setLoading(true);
      setError(null);

      try {
        await TercerosApi.deleteTercero(id);
        // Remover de lista local
        setTerceros((prev) => prev.filter((t) => t.id !== id));
        return true;
      } catch (err) {
        handleError(err, 'Error al eliminar tercero');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const getSaldoTercero = useCallback(
    async (id: string): Promise<{ clienteNombre: string; saldoTotal: number; estado: 'DEUDOR' | 'AL_DIA' } | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const saldo = await TercerosApi.getSaldo(id);
        return saldo;
      } catch (err) {
        handleError(err, 'Error al cargar saldo del tercero');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  // ============================================================================
  // COBROS
  // ============================================================================

  const registrarCobro = useCallback(
    async (data: RegistrarCobroDto): Promise<CobroResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await CobrosApi.create(data);
        // Actualizar lista de ventas después de registrar cobro
        await fetchVentas();
        return response;
      } catch (err) {
        handleError(err, 'Error al registrar cobro');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError, fetchVentas]
  );

  const actualizarCobro = useCallback(
    async (id: string, data: ActualizarCobroDto): Promise<CobroResponseDto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await CobrosApi.update(id, data);
        // Actualizar lista de ventas después de actualizar cobro
        await fetchVentas();
        return response;
      } catch (err) {
        handleError(err, 'Error al actualizar cobro');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError, fetchVentas]
  );

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Calcula métricas del módulo de ventas
   * Basado en datos cargados en memoria
   */
  const calcularMetricas = useCallback((): VentasMetricas => {
    const hoy = new Date();
    const anioHoy = hoy.getFullYear();
    const mesHoy = hoy.getMonth();
    const diaHoy = hoy.getDate();

    // Filtrar ventas de hoy comparando año, mes y día
    const ventasHoy = ventas.filter((v) => {
      const fechaVenta = new Date(v.createdAt);
      return (
        fechaVenta.getFullYear() === anioHoy &&
        fechaVenta.getMonth() === mesHoy &&
        fechaVenta.getDate() === diaHoy
      );
    });

    const ventasPendientes = ventas.filter(
      (v) => v.estadoPago === EstadoPago.PENDIENTE || v.estadoPago === EstadoPago.PARCIAL
    );

    const clientesConDeuda = terceros.filter(
      (t) => t.tipo === TipoTercero.CLIENTE && t.saldoActual > 0
    );

    // Calcular ventas del mes
    const ventasDelMes = ventas.filter((v) => {
      const fechaVenta = new Date(v.createdAt);
      return fechaVenta.getFullYear() === anioHoy && fechaVenta.getMonth() === mesHoy;
    });

    return {
      totalVentasHoy: ventasHoy.length,
      montoVentasHoy: ventasHoy.reduce((sum, v) => sum + v.total, 0),
      ventasPendienteCobro: ventasPendientes.length,
      montoPendienteCobro: ventasPendientes.reduce((sum, v) => sum + v.saldoPendiente, 0),
      totalClientes: terceros.filter((t) => t.tipo === TipoTercero.CLIENTE).length,
      clientesConDeuda: clientesConDeuda.length,
      ventasDelMes: ventasDelMes.length,
      montoDelMes: ventasDelMes.reduce((sum, v) => sum + v.total, 0),
    };
  }, [ventas, terceros]);

  // ============================================================================
  // VALOR DEL CONTEXT
  // ============================================================================

  const value = useMemo(
    () => ({
      // Estado
      ventas,
      cotizaciones,
      terceros,
      loading,
      error,

      // Ventas
      crearVenta,
      fetchVentas,
      fetchVentaById,
      actualizarComprobante,
      getDeudas,

      // Cotizaciones
      crearCotizacion,
      fetchCotizaciones,
      fetchCotizacionById,
      actualizarCotizacion,
      eliminarCotizacion,

      // Terceros
      crearTercero,
      fetchTerceros,
      fetchTerceroById,
      actualizarTercero,
      eliminarTercero,
      getSaldoTercero,

      // Cobros
      registrarCobro,
      actualizarCobro,

      // Utilidades
      calcularMetricas,
      clearError,
    }),
    [
      ventas,
      cotizaciones,
      terceros,
      loading,
      error,
      crearVenta,
      fetchVentas,
      fetchVentaById,
      actualizarComprobante,
      getDeudas,
      crearCotizacion,
      fetchCotizaciones,
      fetchCotizacionById,
      actualizarCotizacion,
      eliminarCotizacion,
      crearTercero,
      fetchTerceros,
      fetchTerceroById,
      actualizarTercero,
      eliminarTercero,
      getSaldoTercero,
      registrarCobro,
      actualizarCobro,
      calcularMetricas,
      clearError,
    ]
  );

  return <VentasContext.Provider value={value}>{children}</VentasContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para usar el contexto de ventas
 * Debe usarse dentro de un VentasProvider
 */
export function useVentas(): VentasContextType {
  const context = useContext(VentasContext);

  if (context === undefined) {
    throw new Error('useVentas debe usarse dentro de un VentasProvider');
  }

  return context;
}
