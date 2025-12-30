/**
 * ENUM: Metodo de Pago para Caja
 *
 * Define los métodos de pago para movimientos de caja.
 * - EFECTIVO: Dinero en efectivo
 * - QR: Pago mediante código QR (Mercado Pago, etc.)
 * - TRANSFERENCIA: Transferencia bancaria
 * - OTRO: Otros métodos de pago
 *
 * Nota: Este enum es específico para el módulo de caja.
 * Difiere del MetodoPago de ventas que incluye TARJETA.
 */
export enum MetodoPagoCaja {
  EFECTIVO = 'EFECTIVO',
  QR = 'QR',
  TRANSFERENCIA = 'TRANSFERENCIA',
  OTRO = 'OTRO',
}
