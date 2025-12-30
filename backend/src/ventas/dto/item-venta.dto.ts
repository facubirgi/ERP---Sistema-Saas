import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, IsNumber, Min } from 'class-validator';

/**
 * DTO: Item de Venta
 *
 * Representa un producto individual dentro de una venta.
 * Incluye el producto, cantidad y precio unitario.
 */
export class ItemVentaDto {
  @ApiProperty({
    description: 'ID del producto',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'El productoId debe ser un UUID válido' })
  productoId: string;

  @ApiProperty({
    description: 'Cantidad de unidades del producto',
    example: 5,
    minimum: 1,
  })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @ApiProperty({
    description: 'Precio unitario del producto',
    example: 150.5,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio unitario debe ser un número válido' },
  )
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  precioUnitario: number;
}
