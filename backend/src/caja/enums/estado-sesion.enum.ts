/**
 * ENUM: Estado de Sesion de Caja
 *
 * Define los estados posibles de una sesión de caja:
 * - ABIERTA: Sesión activa, se pueden registrar movimientos
 * - CERRADA: Sesión finalizada, no se pueden registrar más movimientos
 */
export enum EstadoSesion {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
}
