import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { EstadoPago } from '../enums';

/**
 * DTO: Query Parameters para Listar Ventas
 *
 * Define los filtros opcionales para el endpoint de listado de ventas.
 *
 * Filtros disponibles:
 * - estadoPago: Filtrar por estado de pago (PENDIENTE, PARCIAL, PAGADO)
 * - clienteId: Filtrar por cliente específico
 * - fechaDesde: Filtrar ventas desde esta fecha (YYYY-MM-DD)
 * - fechaHasta: Filtrar ventas hasta esta fecha (YYYY-MM-DD)
 */
export class ListarVentasQueryDto {
  @ApiProperty({
    description: 'Filtrar por estado de pago',
    enum: EstadoPago,
    required: false,
    example: EstadoPago.PENDIENTE,
  })
  @IsOptional()
  @IsEnum(EstadoPago, {
    message: `El estado debe ser uno de: ${Object.values(EstadoPago).join(', ')}`,
  })
  estadoPago?: EstadoPago;

  @ApiProperty({
    description: 'Filtrar por cliente específico (UUID)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El clienteId debe ser un UUID válido' })
  clienteId?: string;

  @ApiProperty({
    description: 'Filtrar ventas desde esta fecha (formato: YYYY-MM-DD)',
    required: false,
    example: '2025-11-01',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'fechaDesde debe tener formato válido (YYYY-MM-DD)' },
  )
  fechaDesde?: string;

  @ApiProperty({
    description: 'Filtrar ventas hasta esta fecha (formato: YYYY-MM-DD)',
    required: false,
    example: '2025-11-30',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'fechaHasta debe tener formato válido (YYYY-MM-DD)' },
  )
  fechaHasta?: string;
}
