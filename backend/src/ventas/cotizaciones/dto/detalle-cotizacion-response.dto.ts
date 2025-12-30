/**
 * DTO de respuesta para detalle de cotización
 */
export class DetalleCotizacionResponseDto {
  id: string;
  numeroComprobante: string;
  clienteNombre: string;
  clienteId: string | null;
  fechaEmision: Date;
  fechaVencimiento: Date;
  items: {
    id: string;
    productoId: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  total: number;
  usuarioEmisor: string;
  empresaNombre: string;
  createdAt: Date;
}
