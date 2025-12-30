/**
 * ENUM: Tipo de Movimiento de Caja
 *
 * Define los tipos de movimientos que pueden registrarse en caja:
 * - INGRESO: Entrada de dinero (ventas, cobros, apertura)
 * - EGRESO: Salida de dinero (gastos, devoluciones, retiros)
 */
export enum TipoMovimiento {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
}
