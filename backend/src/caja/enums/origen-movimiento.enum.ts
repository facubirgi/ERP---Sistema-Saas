/**
 * ENUM: Origen del Movimiento de Caja
 *
 * Define el origen/motivo del movimiento:
 * - APERTURA: Movimiento inicial al abrir caja
 * - VENTA: Cobro proveniente de una venta
 * - GASTO: Gasto operativo
 * - RETIRO: Retiro de efectivo
 * - DEPOSITO: Depósito adicional
 * - DEVOLUCION: Devolución a cliente
 * - AJUSTE: Ajuste por diferencia en arqueo
 */
export enum OrigenMovimiento {
  APERTURA = 'APERTURA',
  VENTA = 'VENTA',
  GASTO = 'GASTO',
  RETIRO = 'RETIRO',
  DEPOSITO = 'DEPOSITO',
  DEVOLUCION = 'DEVOLUCION',
  AJUSTE = 'AJUSTE',
}
