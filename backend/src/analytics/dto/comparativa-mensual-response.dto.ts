import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO: Métricas de un Mes
 *
 * Métricas detalladas de ventas y cobros de un mes.
 */
export class MetricasMesDto {
  @ApiProperty({
    description: 'Total de ventas',
    example: 47100.50,
  })
  totalVentas: number;

  @ApiProperty({
    description: 'Cantidad de ventas',
    example: 87,
  })
  cantidadVentas: number;

  @ApiProperty({
    description: 'Ticket promedio',
    example: 541.38,
  })
  ticketPromedio: number;

  @ApiProperty({
    description: 'Total cobrado',
    example: 45000.00,
  })
  totalCobrado: number;

  @ApiProperty({
    description: 'Total pendiente de cobro',
    example: 2100.50,
  })
  totalPendiente: number;
}

/**
 * DTO: Datos de un Mes
 *
 * Información de un mes con sus métricas.
 */
export class DatosMesDto {
  @ApiProperty({
    description: 'Mes en formato YYYY-MM',
    example: '2026-01',
  })
  mes: string;

  @ApiProperty({
    description: 'Nombre del mes legible',
    example: 'Enero 2026',
  })
  mesNombre: string;

  @ApiProperty({
    description: 'Métricas del mes',
    type: MetricasMesDto,
  })
  metricas: MetricasMesDto;
}

/**
 * DTO: Variaciones Porcentuales
 *
 * Variaciones porcentuales entre dos períodos.
 */
export class VariacionesDto {
  @ApiProperty({
    description: 'Variación porcentual en total de ventas',
    example: 12.5,
  })
  totalVentas: number;

  @ApiProperty({
    description: 'Variación porcentual en cantidad de ventas',
    example: 8.2,
  })
  cantidadVentas: number;

  @ApiProperty({
    description: 'Variación porcentual en ticket promedio',
    example: 3.9,
  })
  ticketPromedio: number;

  @ApiProperty({
    description: 'Variación porcentual en total cobrado',
    example: 10.1,
  })
  totalCobrado: number;
}

/**
 * DTO: Comparativa Mensual Response
 *
 * Respuesta para el endpoint de comparativa mensual.
 * Compara el mes actual con el mes anterior.
 */
export class ComparativaMensualResponseDto {
  @ApiProperty({
    description: 'Datos del mes actual',
    type: DatosMesDto,
  })
  mesActual: DatosMesDto;

  @ApiProperty({
    description: 'Datos del mes anterior',
    type: DatosMesDto,
  })
  mesAnterior: DatosMesDto;

  @ApiProperty({
    description: 'Variaciones porcentuales',
    type: VariacionesDto,
  })
  variaciones: VariacionesDto;
}
