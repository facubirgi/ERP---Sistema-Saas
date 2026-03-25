import { BaseApiClient } from './base.api';
import { CreateUsuarioDto, Usuario } from '../types/auth.types';
import type {
  UsuarioListItem,
  UpdateUsuarioDto,
  CambiarPasswordDto,
  EstadisticasUsuarios,
  UsuarioResponse,
} from '@/lib/types/usuarios.types';

/**
 * Tenant API Service
 * Handles tenant-related operations (users, empresa management)
 * Auth: JWT en cookie httpOnly (automatico con credentials: 'include')
 */
export class TenantApi extends BaseApiClient {
  private static readonly BASE_PATH = '/tenant/usuarios';

  /**
   * Crear nuevo usuario (empleado) para la empresa actual
   * POST /api/tenant/usuarios
   * Requiere rol DUENO
   */
  static async createUsuario(data: CreateUsuarioDto): Promise<{ message: string; usuario: Usuario }> {
    return this.post<{ message: string; usuario: Usuario }>(this.BASE_PATH, data);
  }

  /**
   * Listar todos los usuarios de la empresa
   * GET /api/tenant/usuarios
   * Requiere rol DUENO
   */
  static async getUsuarios(): Promise<UsuarioListItem[]> {
    return this.get<UsuarioListItem[]>(this.BASE_PATH);
  }

  /**
   * Obtener estadisticas de usuarios por rol
   * GET /api/tenant/usuarios/estadisticas
   * Requiere rol DUENO
   */
  static async getEstadisticas(): Promise<EstadisticasUsuarios> {
    return this.get<EstadisticasUsuarios>(`${this.BASE_PATH}/estadisticas`);
  }

  /**
   * Actualizar nombre y/o email de un usuario
   * PATCH /api/tenant/usuarios/:id
   * Requiere rol DUENO
   */
  static async updateUsuario(id: string, data: UpdateUsuarioDto): Promise<UsuarioResponse> {
    return this.patch<UsuarioResponse>(`${this.BASE_PATH}/${id}`, data);
  }

  /**
   * Cambiar contrasena de un usuario
   * POST /api/tenant/usuarios/:id/cambiar-password
   * Requiere rol DUENO
   */
  static async cambiarPassword(id: string, data: CambiarPasswordDto): Promise<void> {
    return this.post<void>(`${this.BASE_PATH}/${id}/cambiar-password`, data);
  }

  /**
   * Activar/desactivar un usuario (toggle)
   * PATCH /api/tenant/usuarios/:id/toggle-activo
   * Requiere rol DUENO
   * No permite desactivar al ultimo dueno activo
   */
  static async toggleActivo(id: string): Promise<UsuarioResponse> {
    return this.patch<UsuarioResponse>(`${this.BASE_PATH}/${id}/toggle-activo`, {});
  }
}
