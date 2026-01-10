// ============================================================================
// ANALYTICS API CLIENT - Sistema SaaS
// ============================================================================
// Cliente para interactuar con endpoints de analytics y métricas
// Base URL: /api/analytics

import { BaseApiClient } from './base.api';
import type {
  VentasMensualesResponseDto,
  ComparativaMensualResponseDto,
  CuentasPorCobrarResponseDto,
  StockCriticoResponseDto,
} from '@/lib/types/analytics.types';

/**
 * Cliente API para obtener métricas y analíticas
 * Auth: JWT en cookie httpOnly (automático con credentials: 'include')
 * El backend automáticamente filtra por empresaId del token
 */
export class AnalyticsApi extends BaseApiClient {
  private static readonly BASE_PATH = '/analytics';

  /**
   * Obtener ventas mensuales
   * GET /api/analytics/ventas-mensuales?meses=12
   *
   * Retorna las ventas de los últimos N meses con totales agregados y promedios.
   *
   * @param meses - Cantidad de meses a consultar (1-24, default: 12)
   * @returns Datos de ventas mensuales con totales y promedios
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getVentasMensuales(
    meses: number = 12,
  ): Promise<VentasMensualesResponseDto> {
    const params = new URLSearchParams();
    params.append('meses', meses.toString());

    const endpoint = `${this.BASE_PATH}/ventas-mensuales?${params.toString()}`;
    return this.get<VentasMensualesResponseDto>(endpoint);
  }

  /**
   * Obtener comparativa mensual
   * GET /api/analytics/comparativa-mensual?mes=2026-01
   *
   * Compara el mes actual con el mes anterior, mostrando variaciones porcentuales.
   *
   * @param mes - Mes a consultar en formato YYYY-MM (opcional, default: mes actual)
   * @returns Comparativa con variaciones porcentuales
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getComparativaMensual(
    mes?: string,
  ): Promise<ComparativaMensualResponseDto> {
    const params = new URLSearchParams();
    if (mes) {
      params.append('mes', mes);
    }

    const endpoint = params.toString()
      ? `${this.BASE_PATH}/comparativa-mensual?${params.toString()}`
      : `${this.BASE_PATH}/comparativa-mensual`;

    return this.get<ComparativaMensualResponseDto>(endpoint);
  }

  /**
   * Obtener cuentas por cobrar
   * GET /api/analytics/cuentas-por-cobrar?limit=10&incluirTodos=false
   *
   * Retorna el listado de clientes con deuda pendiente ordenados por saldo.
   *
   * @param limit - Cantidad de clientes a retornar (1-100, default: 10)
   * @param incluirTodos - Si es true, retorna todos los clientes con deuda
   * @returns Listado de clientes morosos con totales
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getCuentasPorCobrar(
    limit: number = 10,
    incluirTodos: boolean = false,
  ): Promise<CuentasPorCobrarResponseDto> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('incluirTodos', incluirTodos.toString());

    const endpoint = `${this.BASE_PATH}/cuentas-por-cobrar?${params.toString()}`;
    return this.get<CuentasPorCobrarResponseDto>(endpoint);
  }

  /**
   * Obtener stock crítico
   * GET /api/analytics/stock-critico?limit=20&ordenarPor=deficit
   *
   * Retorna los productos con stock menor o igual al stock mínimo.
   *
   * @param limit - Cantidad de productos a retornar (1-100, default: 20)
   * @param ordenarPor - Criterio de ordenamiento: 'deficit' o 'alfabetico' (default: 'deficit')
   * @returns Listado de productos con stock crítico
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getStockCritico(
    limit: number = 20,
    ordenarPor: 'deficit' | 'alfabetico' = 'deficit',
  ): Promise<StockCriticoResponseDto> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('ordenarPor', ordenarPor);

    const endpoint = `${this.BASE_PATH}/stock-critico?${params.toString()}`;
    return this.get<StockCriticoResponseDto>(endpoint);
  }
}
