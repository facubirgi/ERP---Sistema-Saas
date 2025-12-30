/**
 * DTO para item de lista de cotizaciones
 */
export class CotizacionListItemDto {
  id: string;
  numeroComprobante: string;
  clienteNombre: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  total: number;
  convertidaAVenta: boolean;
  createdAt: Date;
}
