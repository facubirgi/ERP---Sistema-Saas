import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO: Categoría Simple
 *
 * Información básica de una categoría.
 */
export class CategoriaSimpleDto {
  @ApiProperty({
    description: 'ID de la categoría',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Electrónica',
  })
  nombre: string;
}

/**
 * DTO: Producto Crítico
 *
 * Información de un producto con stock crítico.
 */
export class ProductoCriticoDto {
  @ApiProperty({
    description: 'ID del producto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Producto A',
  })
  nombre: string;

  @ApiProperty({
    description: 'Código de barras',
    example: '7890123456789',
    nullable: true,
  })
  codigoBarras: string | null;

  @ApiProperty({
    description: 'Stock actual',
    example: 3,
  })
  stockActual: number;

  @ApiProperty({
    description: 'Stock mínimo configurado',
    example: 10,
  })
  stockMinimo: number;

  @ApiProperty({
    description: 'Déficit (cantidad faltante)',
    example: 7,
  })
  deficit: number;

  @ApiProperty({
    description: 'Categoría del producto',
    type: CategoriaSimpleDto,
    nullable: true,
  })
  categoria: CategoriaSimpleDto | null;
}

/**
 * DTO: Stock Crítico Response
 *
 * Respuesta para el endpoint de stock crítico.
 * Incluye productos con stock bajo el mínimo.
 */
export class StockCriticoResponseDto {
  @ApiProperty({
    description: 'Listado de productos con stock crítico',
    type: [ProductoCriticoDto],
  })
  productos: ProductoCriticoDto[];

  @ApiProperty({
    description: 'Total de productos con stock crítico',
    example: 15,
  })
  totalProductosCriticos: number;

  @ApiProperty({
    description: 'Déficit total acumulado',
    example: 87,
  })
  totalDeficit: number;
}
