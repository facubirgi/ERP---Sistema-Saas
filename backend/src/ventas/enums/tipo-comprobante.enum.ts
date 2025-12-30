/**
 * ENUM: Tipo de Comprobante
 *
 * Define el tipo de documento comercial.
 * - VENTA: Comprobante confirmado de venta
 * - COTIZACION: Presupuesto/cotización sin afectar stock ni generar movimientos
 */
export enum TipoComprobante {
  VENTA = 'VENTA',
  COTIZACION = 'COTIZACION',
}
