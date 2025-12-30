/**
 * ENUM: Estado de Caja
 *
 * Define los estados posibles de una sesión de caja.
 * - ABIERTA: Sesión activa, se pueden registrar movimientos
 * - CERRADA: Sesión finalizada, no se permiten más movimientos
 */
export enum EstadoCaja {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
}
