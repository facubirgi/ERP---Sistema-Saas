/**
 * ENUM: Metodo de Pago
 *
 * Define los métodos de pago disponibles para registrar cobros.
 * - EFECTIVO: Pago en efectivo
 * - QR: Pago mediante código QR (Mercado Pago, etc.)
 * - TARJETA: Pago con tarjeta de débito/crédito
 * - TRANSFERENCIA: Transferencia bancaria
 */
export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  QR = 'QR',
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA',
}
