import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO DE PAGINACIÓN GENÉRICO
 *
 * Usado para todas las consultas paginadas del sistema.
 */
export class PaginationDto {
  @ApiProperty({
    description: 'Página actual (empiezan en 1)',
    required: false,
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad de items por página',
    required: false,
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El límite máximo es 100 items' })
  limit?: number = 20;
}

/**
 * RESPONSE GENÉRICO PAGINADO
 *
 * Estructura estándar para respuestas paginadas.
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Datos de la página actual', isArray: true })
  data: T[];

  @ApiProperty({ description: 'Total de items en la base de datos' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Items por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas disponibles' })
  totalPages: number;

  @ApiProperty({ description: 'Si hay una página siguiente' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Si hay una página anterior' })
  hasPrevPage: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNextPage = page < this.totalPages;
    this.hasPrevPage = page > 1;
  }
}
