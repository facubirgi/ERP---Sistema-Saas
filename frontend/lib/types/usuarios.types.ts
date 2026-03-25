import { UsuarioRol } from './auth.types';

// Response del backend al listar usuarios (sin passwordHash)
export interface UsuarioListItem {
  id: string;
  empresaId: string;
  nombre: string;
  email: string;
  rol: UsuarioRol;
  activo: boolean;
  createdAt: string;
}

// DTOs para requests
export interface UpdateUsuarioDto {
  nombre?: string;
  email?: string;
}

export interface CambiarPasswordDto {
  nuevaPassword: string;
}

// Response de estadísticas
export interface EstadisticasUsuarios {
  totalActivos: number;
  duenos: number;
  empleados: number;
}

// Response de toggle activo y actualizar
export type UsuarioResponse = UsuarioListItem;
