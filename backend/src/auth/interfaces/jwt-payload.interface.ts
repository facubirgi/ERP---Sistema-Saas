export interface JwtPayload {
  sub: string; // Usuario ID (UUID)
  email: string; // Usuario email
  empresaId: string; // CRITICAL: Tenant identifier (UUID)
  rol: string;
  nombre: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  empresaId: string;
  rol: 'DUEÑO' | 'EMPLEADO';
  nombre: string;
}
