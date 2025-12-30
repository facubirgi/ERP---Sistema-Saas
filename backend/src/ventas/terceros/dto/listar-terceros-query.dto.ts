import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TipoTercero } from '../../enums';

/**
 * DTO: Query Parameters para Listar Terceros
 *
 * Define los filtros opcionales para el endpoint de listado de terceros.
 *
 * Filtros disponibles:
 * - tipo: Filtrar por tipo de tercero (CLIENTE o PROVEEDOR)
 * - busqueda: Búsqueda por nombre (case-insensitive, LIKE %busqueda%)
 */
export class ListarTercerosQueryDto {
  @ApiProperty({
    description: 'Filtrar por tipo de tercero',
    enum: TipoTercero,
    required: false,
    example: TipoTercero.CLIENTE,
  })
  @IsOptional()
  @IsEnum(TipoTercero, {
    message: `El tipo debe ser uno de: ${Object.values(TipoTercero).join(', ')}`,
  })
  tipo?: TipoTercero;

  @ApiProperty({
    description: 'Búsqueda por nombre (case-insensitive)',
    required: false,
    example: 'Juan',
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser un texto' })
  busqueda?: string;
}
