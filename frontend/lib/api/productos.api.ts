// ============================================================================
// PRODUCTOS API CLIENT - Sistema SaaS
// ============================================================================
// Cliente para interactuar con endpoints de productos
// Base URL: /api/productos

import { BaseApiClient } from './base.api';
import type {
  Producto,
  CreateProductoDto,
  UpdateProductoDto,
  PaginatedResponse,
  PaginationDto,
  SearchProductoDto,
} from '@/lib/types/inventario.types';

/**
 * Cliente API para gestión de productos
 * Auth: JWT en cookie httpOnly (automático con credentials: 'include')
 * El backend automáticamente filtra por empresaId del token
 */
export class ProductosApi extends BaseApiClient {
  private static readonly BASE_PATH = '/productos';

  /**
   * Obtener todos los productos activos (paginados)
   * GET /api/productos?page=1&limit=20
   *
   * NOTA: Los productos incluyen la relación con categoría
   *
   * @param pagination - Opciones de paginación (opcional)
   * @returns Respuesta paginada con productos activos
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getAll(
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Producto>> {
    const params = new URLSearchParams();

    if (pagination?.page) {
      params.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      params.append('limit', pagination.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = `${this.BASE_PATH}${queryString ? `?${queryString}` : ''}`;

    return this.get<PaginatedResponse<Producto>>(endpoint);
  }

  /**
   * Búsqueda híbrida de productos (para POS)
   * GET /api/productos/search?termino=xxx&page=1&limit=20
   *
   * Estrategia del backend:
   * 1. Si encuentra código de barras EXACTO → retorna 1 resultado (sin paginación)
   * 2. Si no, busca por nombre (ILIKE) → retorna lista paginada
   *
   * Ideal para escáneres de código de barras + búsqueda manual
   *
   * @param searchDto - Término de búsqueda y paginación
   * @returns Respuesta paginada con productos encontrados
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async search(
    searchDto: SearchProductoDto
  ): Promise<PaginatedResponse<Producto>> {
    const params = new URLSearchParams();

    params.append('termino', searchDto.termino);

    if (searchDto.page) {
      params.append('page', searchDto.page.toString());
    }
    if (searchDto.limit) {
      params.append('limit', searchDto.limit.toString());
    }

    const endpoint = `${this.BASE_PATH}/search?${params.toString()}`;

    return this.get<PaginatedResponse<Producto>>(endpoint);
  }

  /**
   * Obtener productos con stock bajo
   * GET /api/productos/bajo-stock?page=1&limit=20
   *
   * Retorna productos donde: stockActual <= stockMinimo
   * Ordenados por nivel de stock (más críticos primero)
   *
   * @param pagination - Opciones de paginación (opcional)
   * @returns Respuesta paginada con productos de stock bajo
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getBajoStock(
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Producto>> {
    const params = new URLSearchParams();

    if (pagination?.page) {
      params.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      params.append('limit', pagination.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = `${this.BASE_PATH}/bajo-stock${queryString ? `?${queryString}` : ''}`;

    return this.get<PaginatedResponse<Producto>>(endpoint);
  }

  /**
   * Obtener un producto por ID
   * GET /api/productos/:id
   *
   * NOTA: Incluye la relación con categoría
   *
   * @param id - UUID del producto
   * @returns Producto encontrado con categoría
   * @throws 404 si no existe o pertenece a otra empresa
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getById(id: string): Promise<Producto> {
    return this.get<Producto>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Crear nuevo producto
   * POST /api/productos
   *
   * Validaciones del backend:
   * - Código de barras único por empresa (si se proporciona)
   * - Categoría debe existir y pertenecer a la empresa
   * - Margen válido: precioVenta >= precioCosto
   * - Stock no negativo
   *
   * @param data - Datos del nuevo producto
   * @returns Producto creado con categoría incluida
   * @throws 400 si validaciones fallan
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async create(
    data: CreateProductoDto
  ): Promise<Producto> {
    return this.post<Producto>(this.BASE_PATH, data);
  }

  /**
   * Actualizar producto existente
   * PUT /api/productos/:id
   *
   * CARACTERÍSTICA ESPECIAL: Margen Inteligente
   * Si solo se actualiza precioCosto (sin precioVenta):
   * - Backend calcula el margen actual
   * - Aplica el mismo margen al nuevo precioCosto
   * - Actualiza precioVenta automáticamente
   *
   * Validaciones:
   * - Código de barras único (si se cambia)
   * - Categoría válida (si se cambia)
   * - Margen válido
   *
   * @param id - UUID del producto
   * @param data - Datos a actualizar
   * @returns Producto actualizado con categoría
   * @throws 404 si no existe
   * @throws 400 si validaciones fallan
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async update(
    id: string,
    data: UpdateProductoDto
  ): Promise<Producto> {
    return this.put<Producto>(`${this.BASE_PATH}/${id}`, data);
  }

  /**
   * Eliminar producto permanentemente (hard delete)
   * DELETE /api/productos/:id
   *
   * ADVERTENCIA: Eliminación permanente e irreversible
   * El producto se elimina completamente de la base de datos
   *
   * @param id - UUID del producto
   * @returns void (204 No Content)
   * @throws 404 si no existe
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async deleteProducto(id: string): Promise<void> {
    return this.delete<void>(`${this.BASE_PATH}/${id}`);
  }
}
