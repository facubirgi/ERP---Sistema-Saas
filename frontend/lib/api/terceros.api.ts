// ============================================================================
// TERCEROS API CLIENT - Sistema SaaS
// ============================================================================
// Cliente para interactuar con endpoints de terceros (clientes/proveedores)
// Base URL: /api/terceros

import { BaseApiClient } from './base.api';
import type {
  CrearTerceroDto,
  ActualizarTerceroDto,
  TerceroResponseDto,
  ListarTercerosQueryDto,
  SaldoTerceroResponseDto,
} from '@/lib/types/ventas.types';

/**
 * Cliente API para gestión de terceros
 * Auth: JWT en cookie httpOnly (automático con credentials: 'include')
 * El backend automáticamente filtra por empresaId del token
 */
export class TercerosApi extends BaseApiClient {
  private static readonly BASE_PATH = '/terceros';

  /**
   * Crear un nuevo tercero
   * POST /api/terceros
   *
   * Validaciones:
   * - nombre: max 200 caracteres
   * - direccion: max 300 caracteres (opcional)
   * - tipo: CLIENTE | PROVEEDOR
   *
   * El saldoActual se inicializa automáticamente en 0
   *
   * @param data - Datos del tercero
   * @returns Tercero creado
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async create(data: CrearTerceroDto): Promise<TerceroResponseDto> {
    return this.post<TerceroResponseDto>(this.BASE_PATH, data);
  }

  /**
   * Obtener lista de terceros con filtros
   * GET /api/terceros?tipo=CLIENTE&busqueda=juan
   *
   * Filtros disponibles:
   * - tipo: CLIENTE | PROVEEDOR
   * - busqueda: Búsqueda por nombre (case-insensitive)
   *
   * @param query - Filtros (opcional)
   * @returns Array simple con lista de terceros
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getAll(query?: ListarTercerosQueryDto): Promise<TerceroResponseDto[]> {
    const params = new URLSearchParams();

    if (query) {
      // Solo agregar los parámetros de filtro que el backend espera (tipo y busqueda)
      if (query.tipo) {
        params.append('tipo', query.tipo);
      }
      if (query.busqueda) {
        params.append('busqueda', query.busqueda);
      }
    }

    const queryString = params.toString();
    const endpoint = queryString ? `${this.BASE_PATH}?${queryString}` : this.BASE_PATH;

    return this.get<TerceroResponseDto[]>(endpoint);
  }

  /**
   * Obtener detalle de un tercero
   * GET /api/terceros/:id
   *
   * Incluye información del saldo actual
   *
   * @param id - UUID del tercero
   * @returns Detalle del tercero
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getById(id: string): Promise<TerceroResponseDto> {
    return this.get<TerceroResponseDto>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Actualizar un tercero
   * PATCH /api/terceros/:id
   *
   * Campos actualizables:
   * - nombre
   * - direccion
   * - tipo
   *
   * NOTA: El saldoActual NO se puede actualizar manualmente
   *
   * @param id - UUID del tercero
   * @param data - Datos a actualizar
   * @returns Tercero actualizado
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async update(id: string, data: ActualizarTerceroDto): Promise<TerceroResponseDto> {
    return this.patch<TerceroResponseDto>(`${this.BASE_PATH}/${id}`, data);
  }

  /**
   * Eliminar un tercero (soft delete)
   * DELETE /api/terceros/:id
   *
   * Validación: No se puede eliminar si tiene saldo pendiente (saldoActual !== 0)
   *
   * Efecto en comprobantes:
   * - Los comprobantes asociados quedan con terceroId = null (SET NULL)
   *
   * @param id - UUID del tercero
   * @returns void (204 No Content)
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async deleteTercero(id: string): Promise<void> {
    await super.delete(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Obtener saldo de un tercero
   * GET /api/terceros/:id/saldo
   *
   * Retorna:
   * - Nombre del tercero
   * - Saldo total pendiente
   * - Estado: DEUDOR (saldo > 0) | AL_DIA (saldo = 0)
   *
   * @param id - UUID del tercero
   * @returns Información del saldo
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getSaldo(id: string): Promise<SaldoTerceroResponseDto> {
    return this.get<SaldoTerceroResponseDto>(`${this.BASE_PATH}/${id}/saldo`);
  }
}
