import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO: Detalle Item
 *
 * Representa un item individual en el detalle de una venta.
 * Se usa para mostrar los productos vendidos en un comprobante.
 */
export class DetalleItemDto {
  @ApiProperty({
    example: 'uuid-producto',
    description: 'ID del producto vendido',
  })
  productoId: string;

  @ApiProperty({
    example: 'Coca Cola 2L',
    description: 'Nombre del producto al momento de la venta',
  })
  nombreProducto: string;

  @ApiProperty({
    example: 2,
    description: 'Cantidad vendida',
  })
  cantidad: number;

  @ApiProperty({
    example: 25.5,
    description: 'Precio unitario al momento de la venta',
  })
  precioUnitario: number;

  @ApiProperty({
    example: 51.0,
    description: 'Subtotal del item (cantidad x precioUnitario)',
  })
  subtotal: number;
}
