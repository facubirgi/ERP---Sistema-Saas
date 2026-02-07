// ============================================================================
// VENTAS API CLIENT - Sistema SaaS
// ============================================================================
// Cliente para interactuar con endpoints de ventas y comprobantes
// Base URL: /api/ventas

import { BaseApiClient } from './base.api';
import type {
  CrearVentaDto,
  VentaResponseDto,
  DetalleVentaResponseDto,
  ListarVentasQueryDto,
  VentaListItemDto,
  ActualizarComprobanteDto,
  DeudaClienteDto,
  ExportarCobrosResponseDto,
  AnularVentaDto,
  AnularVentaResponseDto,
} from '@/lib/types/ventas.types';

/**
 * Cliente API para gestión de ventas
 * Auth: JWT en cookie httpOnly (automático con credentials: 'include')
 * El backend automáticamente filtra por empresaId del token
 */
export class VentasApi extends BaseApiClient {
  private static readonly BASE_PATH = '/ventas';

  /**
   * Crear una nueva venta
   * POST /api/ventas
   *
   * Validaciones del backend:
   * - Ventas anónimas (sin clienteId) deben pagarse completas
   * - Cliente debe existir y ser tipo CLIENTE
   * - Stock suficiente para cada producto
   * - metodoPago requerido si montoPagado > 0
   *
   * Operaciones atómicas:
   * - Crea comprobante
   * - Crea detalles de venta
   * - Descuenta stock de productos (con lock pesimista)
   * - Registra cobro inicial (si montoPagado > 0)
   * - Actualiza saldo del tercero (si aplica)
   *
   * @param data - Datos de la venta
   * @returns Respuesta con comprobante y cobro creados
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async create(data: CrearVentaDto): Promise<VentaResponseDto> {
    return this.post<VentaResponseDto>(this.BASE_PATH, data);
  }

  /**
   * Obtener lista de ventas con filtros
   * GET /api/ventas?estadoPago=PENDIENTE&clienteId=xxx
   *
   * Filtros disponibles:
   * - estadoPago: PENDIENTE | PARCIAL | PAGADO
   * - clienteId: UUID del cliente
   * - fechaDesde: YYYY-MM-DD
   * - fechaHasta: YYYY-MM-DD
   *
   * @param query - Filtros (opcional)
   * @returns Array simple con lista de ventas
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getAll(query?: ListarVentasQueryDto): Promise<VentaListItemDto[]> {
    const params = new URLSearchParams();

    if (query?.estadoPago) {
      params.append('estadoPago', query.estadoPago);
    }
    if (query?.clienteId) {
      params.append('clienteId', query.clienteId);
    }
    if (query?.fechaDesde) {
      params.append('fechaDesde', query.fechaDesde);
    }
    if (query?.fechaHasta) {
      params.append('fechaHasta', query.fechaHasta);
    }

    const queryString = params.toString();
    const endpoint = `${this.BASE_PATH}${queryString ? `?${queryString}` : ''}`;

    return this.get<VentaListItemDto[]>(endpoint);
  }

  /**
   * Obtener detalle completo de una venta
   * GET /api/ventas/:id
   *
   * Incluye:
   * - Datos del comprobante
   * - Cliente asociado (si existe)
   * - Detalles de items vendidos
   * - Historial de cobros
   *
   * @param id - UUID del comprobante
   * @returns Detalle completo de la venta
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getById(id: string): Promise<DetalleVentaResponseDto> {
    return this.get<DetalleVentaResponseDto>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Actualizar un comprobante
   * PATCH /api/ventas/:id
   *
   * Casos de uso:
   * - Asignar cliente a venta anónima
   * - Cambiar cliente de una venta
   * - Convertir venta a anónima (terceroId = null)
   *
   * Validación: Solo si saldoPendiente = 0
   *
   * @param id - UUID del comprobante
   * @param data - Datos a actualizar
   * @returns Detalle actualizado de la venta
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async update(id: string, data: ActualizarComprobanteDto): Promise<DetalleVentaResponseDto> {
    return this.patch<DetalleVentaResponseDto>(`${this.BASE_PATH}/${id}`, data);
  }

  /**
   * Obtener cuenta corriente de un cliente (deudas pendientes)
   * GET /api/ventas/deudas/:clienteId
   *
   * Retorna comprobantes con estado PENDIENTE o PARCIAL
   * Ordenados por fecha (más antiguos primero)
   *
   * @param clienteId - UUID del cliente
   * @returns Lista de comprobantes con deuda
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getDeudas(clienteId: string): Promise<DeudaClienteDto[]> {
    return this.get<DeudaClienteDto[]>(`${this.BASE_PATH}/deudas/${clienteId}`);
  }

  /**
   * Exportar cobros de la sesión de caja activa
   * GET /api/ventas/cobros/export
   *
   * Obtiene todos los cobros registrados durante la sesión de caja actual
   * para exportarlos a Excel/CSV
   *
   * Incluye:
   * - Información de la sesión actual
   * - Lista de cobros con cliente y comprobante
   * - Resumen total y por método de pago
   *
   * Validación:
   * - Requiere que haya una sesión de caja ABIERTA
   * - Retorna error 400 si no hay sesión activa
   *
   * @returns Datos completos para exportación
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async exportarCobros(): Promise<ExportarCobrosResponseDto> {
    return this.get<ExportarCobrosResponseDto>(`${this.BASE_PATH}/cobros/export`);
  }

  /**
   * Anular una venta
   * POST /api/ventas/:id/anular
   *
   * Requisitos:
   * - La venta debe existir y no estar eliminada
   * - La venta debe pertenecer a la sesión de caja actual
   * - Motivo de anulación mínimo 10 caracteres
   *
   * Operaciones atómicas:
   * - Soft delete del comprobante
   * - Reversión del stock de cada producto
   * - Creación de movimiento EGRESO/DEVOLUCION en caja
   * - Ajuste del saldo del cliente (si aplica)
   *
   * @param id - UUID del comprobante a anular
   * @param data - Datos de anulación (motivo)
   * @returns Respuesta con detalles de la anulación
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async anularVenta(id: string, data: AnularVentaDto): Promise<AnularVentaResponseDto> {
    return this.post<AnularVentaResponseDto>(`${this.BASE_PATH}/${id}/anular`, data);
  }
}
