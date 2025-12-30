import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';

/**
 * DTO PARA CREAR PRODUCTO
 *
 * Validaciones críticas:
 * - Precios positivos (> 0.01)
 * - Precio de venta >= precio de costo (validación de margen)
 * - Stock >= 0
 * - Categoría debe existir y pertenecer al tenant
 *
 * NOTA: empresaId NO se incluye (se toma del JWT)
 */
export class CreateProductoDto {
  @ApiProperty({
    description: 'Código de barras del producto (opcional, único por tenant)',
    example: '7790001234567',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'El código de barras debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El código de barras no puede exceder 50 caracteres',
  })
  codigoBarras?: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Coca Cola 500ml',
    maxLength: 200,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Precio de costo del producto',
    example: 100.5,
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de costo debe tener máximo 2 decimales' },
  )
  @IsPositive({ message: 'El precio de costo debe ser mayor a 0' })
  @Min(0.01, { message: 'El precio de costo mínimo es 0.01' })
  precioCosto: number;

  @ApiProperty({
    description:
      'Precio de venta del producto (debe ser >= precio de costo para validar margen)',
    example: 150.0,
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de venta debe tener máximo 2 decimales' },
  )
  @IsPositive({ message: 'El precio de venta debe ser mayor a 0' })
  @Min(0.01, { message: 'El precio de venta mínimo es 0.01' })
  precioVenta: number;

  @ApiProperty({
    description: 'Stock actual del producto',
    example: 50,
    default: 0,
    minimum: 0,
  })
  @IsInt({ message: 'El stock actual debe ser un número entero' })
  @Min(0, { message: 'El stock actual no puede ser negativo' })
  stockActual: number = 0;

  @ApiProperty({
    description: 'Stock mínimo del producto (para alertas)',
    example: 5,
    default: 5,
    minimum: 0,
  })
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  stockMinimo: number = 5;

  @ApiProperty({
    description: 'UUID de la categoría a la que pertenece el producto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoriaId: string;
}
