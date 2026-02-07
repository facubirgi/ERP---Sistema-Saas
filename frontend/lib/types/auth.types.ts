// Mirrors backend DTOs and entities

export enum UsuarioRol {
  DUENO = 'DUEÑO',
  EMPLEADO = 'EMPLEADO',
}

export interface Empresa {
  id: number;
  razonSocial: string;
  cuit?: string | null;
  email: string;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
}

export interface Usuario {
  id: number;
  empresaId: number;
  nombre: string;
  email: string;
  rol: UsuarioRol;
  activo: boolean;
}

// DTOs for API requests
export interface CreateEmpresaDto {
  razonSocial: string;
  cuit?: string;
  email: string;
}

export interface CreateUsuarioDto {
  nombre: string;
  email: string;
  password: string;
  rol?: UsuarioRol;
}

export interface RegisterDto {
  empresa: CreateEmpresaDto;
  usuario: CreateUsuarioDto;
}

export interface LoginDto {
  empresaEmail: string;
  usuarioEmail: string;
  password: string;
}

// API Response types
// Note: accessToken is now set as httpOnly cookie by backend, not in JSON response
export interface RegisterResponse {
  message: string;
  empresa: Empresa;
  usuario: Omit<Usuario, 'passwordHash'>;
}

export interface LoginResponse {
  message: string;
  usuario: Omit<Usuario, 'passwordHash'>;
  empresa: Empresa;
}

export interface AuthUser {
  userId: number;
  email: string;
  empresaId: number;
  rol: UsuarioRol;
  nombre: string;
  // Datos de empresa
  razonSocial: string;
  empresaCuit?: string | null;
  empresaDireccion?: string | null;
  empresaTelefono?: string | null;
  empresaEmail?: string | null;
}
