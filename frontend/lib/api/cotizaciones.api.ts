// ============================================================================
// COTIZACIONES API CLIENT - Sistema SaaS
// ============================================================================
// Cliente para interactuar con endpoints de cotizaciones
// Base URL: /api/cotizaciones

import { BaseApiClient } from './base.api';
import type {
  CrearCotizacionDto,
  ActualizarCotizacionDto,
  ListarCotizacionesQueryDto,
  CotizacionResponseDto,
  DetalleCotizacionResponseDto,
  CotizacionListItemDto,
  GenerarVentaDesdeCotizacionDto,
  VentaResponseDto,
} from '@/lib/types/ventas.types';

/**
 * Cliente API para gestión de cotizaciones
 * Auth: JWT en cookie httpOnly (automático con credentials: 'include')
 * El backend automáticamente filtra por empresaId del token
 */
export class CotizacionesApi extends BaseApiClient {
  private static readonly BASE_PATH = '/cotizaciones';

  /**
   * Crear una nueva cotización
   * POST /api/cotizaciones
   *
   * @param data - Datos de la cotización
   * @returns Respuesta con la cotización creada
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async create(data: CrearCotizacionDto): Promise<CotizacionResponseDto> {
    return this.post<CotizacionResponseDto>(this.BASE_PATH, data);
  }

  /**
   * Obtener lista de cotizaciones con filtros
   * GET /api/cotizaciones?clienteNombre=xxx
   *
   * Filtros disponibles:
   * - clienteNombre: Nombre del cliente
   * - fechaDesde: YYYY-MM-DD
   * - fechaHasta: YYYY-MM-DD
   *
   * @param query - Filtros opcionales
   * @returns Array con lista de cotizaciones
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getAll(query?: ListarCotizacionesQueryDto): Promise<CotizacionListItemDto[]> {
    const params = new URLSearchParams();

    if (query?.clienteNombre) {
      params.append('clienteNombre', query.clienteNombre);
    }
    if (query?.fechaDesde) {
      params.append('fechaDesde', query.fechaDesde);
    }
    if (query?.fechaHasta) {
      params.append('fechaHasta', query.fechaHasta);
    }

    const queryString = params.toString();
    const endpoint = `${this.BASE_PATH}${queryString ? `?${queryString}` : ''}`;

    return this.get<CotizacionListItemDto[]>(endpoint);
  }

  /**
   * Obtener detalle completo de una cotización
   * GET /api/cotizaciones/:id
   *
   * Incluye:
   * - Datos de la cotización
   * - Cliente asociado (si existe)
   * - Detalles de items cotizados
   *
   * @param id - UUID de la cotización
   * @returns Detalle completo de la cotización
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getById(id: string): Promise<DetalleCotizacionResponseDto> {
    return this.get<DetalleCotizacionResponseDto>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Actualizar una cotización existente
   * PATCH /api/cotizaciones/:id
   *
   * @param id - UUID de la cotización
   * @param data - Datos a actualizar
   * @returns Cotización actualizada
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async update(id: string, data: ActualizarCotizacionDto): Promise<CotizacionResponseDto> {
    return this.patch<CotizacionResponseDto>(`${this.BASE_PATH}/${id}`, data);
  }

  /**
   * Eliminar una cotización
   * DELETE /api/cotizaciones/:id
   *
   * @param id - UUID de la cotización a eliminar
   * @returns void (204 No Content)
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async remove(id: string): Promise<void> {
    return this.delete(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Generar una venta desde una cotización
   * POST /api/cotizaciones/:id/generar-venta
   *
   * Convierte una cotización en una venta nueva. Los items de la cotización
   * se convierten en items de venta y se descuenta el stock.
   *
   * @param id - UUID de la cotización
   * @param data - Datos de pago inicial (montoPagado, metodoPago)
   * @returns Venta generada con información del comprobante y cobro
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async generarVenta(
    id: string,
    data: GenerarVentaDesdeCotizacionDto,
  ): Promise<VentaResponseDto> {
    return this.post<VentaResponseDto>(
      `${this.BASE_PATH}/${id}/generar-venta`,
      data,
    );
  }
}