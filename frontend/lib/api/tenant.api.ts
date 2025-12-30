import { BaseApiClient } from './base.api';
import { CreateUsuarioDto, Usuario } from '../types/auth.types';

/**
 * Tenant API Service
 * Handles tenant-related operations (users, empresa management)
 * Auth: JWT en cookie httpOnly (automático con credentials: 'include')
 */
export class TenantApi extends BaseApiClient {
  /**
   * Create a new user (employee) for the current empresa
   * Requires DUEÑO role
   * @param data - Datos del nuevo usuario
   * @returns Usuario creado
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async createUsuario(data: CreateUsuarioDto): Promise<{ message: string; usuario: Usuario }> {
    return this.post<{ message: string; usuario: Usuario }>('/tenant/usuarios', data);
  }

  // Future endpoints can be added here:
  // - getUsuarios()
  // - updateUsuario()
  // - deleteUsuario()
  // - getEmpresaInfo()
  // - updateEmpresa()
}
