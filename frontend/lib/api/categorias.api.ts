// ============================================================================
// CATEGORIAS API CLIENT - Sistema SaaS
// ============================================================================
// Cliente para interactuar con endpoints de categorías
// Base URL: /api/categorias

import { BaseApiClient } from './base.api';
import type {
  Categoria,
  CreateCategoriaDto,
  UpdateCategoriaDto,
  PaginatedResponse,
  PaginationDto,
  CategoriaProductosCountResponse,
} from '@/lib/types/inventario.types';

/**
 * Cliente API para gestión de categorías
 * Todos los métodos requieren autenticación (JWT token)
 * El backend automáticamente filtra por empresaId del token
 */
export class CategoriasApi extends BaseApiClient {
  private static readonly BASE_PATH = '/categorias';

  /**
   * Obtener todas las categorías activas (paginadas)
   * GET /api/categorias?page=1&limit=20
   *
   * @param pagination - Opciones de paginación (opcional)
   * @returns Respuesta paginada con categorías activas
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getAll(
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Categoria>> {
    const params = new URLSearchParams();

    if (pagination?.page) {
      params.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      params.append('limit', pagination.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = `${this.BASE_PATH}${queryString ? `?${queryString}` : ''}`;

    return this.get<PaginatedResponse<Categoria>>(endpoint);
  }

  /**
   * Obtener todas las categorías eliminadas (paginadas)
   * GET /api/categorias/deleted?page=1&limit=20
   *
   * @param pagination - Opciones de paginación (opcional)
   * @returns Respuesta paginada con categorías eliminadas
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getDeleted(
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Categoria>> {
    const params = new URLSearchParams();

    if (pagination?.page) {
      params.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      params.append('limit', pagination.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = `${this.BASE_PATH}/deleted${queryString ? `?${queryString}` : ''}`;

    return this.get<PaginatedResponse<Categoria>>(endpoint);
  }

  /**
   * Obtener una categoría por ID
   * GET /api/categorias/:id
   *
   * @param id - UUID de la categoría
   * @returns Categoría encontrada
   * @throws 404 si no existe o pertenece a otra empresa
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getById(id: string): Promise<Categoria> {
    return this.get<Categoria>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Contar productos en una categoría
   * GET /api/categorias/:id/productos-count
   *
   * @param id - UUID de la categoría
   * @returns Objeto con count de productos activos
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async getProductosCount(
    id: string
  ): Promise<CategoriaProductosCountResponse> {
    return this.get<CategoriaProductosCountResponse>(
      `${this.BASE_PATH}/${id}/productos-count`
    );
  }

  /**
   * Crear nueva categoría
   * POST /api/categorias
   *
   * Validaciones:
   * - Nombre: requerido, 2-100 caracteres
   * - Nombre único por empresa (incluyendo eliminadas)
   *
   * @param data - Datos de la nueva categoría
   * @returns Categoría creada
   * @throws 400 si el nombre ya existe
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async create(
    data: CreateCategoriaDto
  ): Promise<Categoria> {
    return this.post<Categoria>(this.BASE_PATH, data);
  }

  /**
   * Actualizar categoría existente
   * PATCH /api/categorias/:id
   *
   * Validaciones:
   * - Nombre único por empresa (si se proporciona)
   *
   * @param id - UUID de la categoría
   * @param data - Datos a actualizar
   * @returns Categoría actualizada
   * @throws 404 si no existe
   * @throws 400 si el nombre ya existe
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async update(
    id: string,
    data: UpdateCategoriaDto
  ): Promise<Categoria> {
    return this.patch<Categoria>(`${this.BASE_PATH}/${id}`, data);
  }

  /**
   * Eliminar categoría (soft delete)
   * DELETE /api/categorias/:id
   *
   * IMPORTANTE: RESTRICT - No se puede eliminar si tiene productos activos
   *
   * @param id - UUID de la categoría
   * @returns void (204 No Content)
   * @throws 400 si tiene productos activos
   * @throws 404 si no existe
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async softDelete(id: string): Promise<void> {
    return this.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Restaurar categoría eliminada
   * POST /api/categorias/:id/restore
   *
   * Validaciones:
   * - No puede existir otra categoría activa con el mismo nombre
   *
   * @param id - UUID de la categoría eliminada
   * @returns Categoría restaurada
   * @throws 404 si no existe
   * @throws 400 si ya existe otra activa con el mismo nombre
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async restore(id: string): Promise<Categoria> {
    return this.post<Categoria>(`${this.BASE_PATH}/${id}/restore`, {});
  }
}
