/**
 * ENUM: Estado de Pago
 *
 * Define el estado de pago de un comprobante.
 * - PENDIENTE: No se ha registrado ningún pago (saldoPendiente = total)
 * - PARCIAL: Se ha pagado parcialmente (0 < saldoPendiente < total)
 * - PAGADO: Pago completo (saldoPendiente = 0)
 */
export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  PARCIAL = 'PARCIAL',
  PAGADO = 'PAGADO',
}
