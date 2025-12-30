import { IsString, IsNumber, IsUUID, Min, MinLength } from 'class-validator';

/**
 * DTO para un item de cotización
 */
export class ItemCotizacionDto {
  /**
   * ID del producto
   */
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
  productoId: string;

  /**
   * Nombre del producto (desnormalizado)
   */
  @IsString()
  @MinLength(1, { message: 'El nombre del producto es requerido' })
  nombreProducto: string;

  /**
   * Cantidad del producto
   */
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;

  /**
   * Precio unitario del producto
   */
  @IsNumber({}, { message: 'El precio unitario debe ser un número' })
  @Min(0, { message: 'El precio unitario debe ser mayor o igual a 0' })
  precioUnitario: number;

  /**
   * Subtotal calculado (cantidad * precioUnitario)
   */
  @IsNumber({}, { message: 'El subtotal debe ser un número' })
  @Min(0, { message: 'El subtotal debe ser mayor o igual a 0' })
  subtotal: number;
}
