import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO: Venta Mensual
 *
 * Representa las métricas de ventas de un mes específico.
 */
export class VentaMensualDto {
  @ApiProperty({
    description: 'Mes en formato YYYY-MM',
    example: '2025-01',
  })
  mes: string;

  @ApiProperty({
    description: 'Nombre del mes legible',
    example: 'Enero 2025',
  })
  mesNombre: string;

  @ApiProperty({
    description: 'Total de ventas del mes',
    example: 47100.50,
  })
  total: number;

  @ApiProperty({
    description: 'Cantidad de ventas realizadas',
    example: 87,
  })
  cantidad: number;

  @ApiProperty({
    description: 'Ticket promedio del mes',
    example: 541.38,
  })
  promedio: number;
}

/**
 * DTO: Ventas Mensuales Response
 *
 * Respuesta para el endpoint de ventas mensuales.
 * Incluye los datos de cada mes y totales del período.
 */
export class VentasMensualesResponseDto {
  @ApiProperty({
    description: 'Array de ventas mensuales',
    type: [VentaMensualDto],
  })
  meses: VentaMensualDto[];

  @ApiProperty({
    description: 'Total del período completo',
    example: 565200.00,
  })
  totalPeriodo: number;

  @ApiProperty({
    description: 'Promedio mensual del período',
    example: 47100.00,
  })
  promedioMensual: number;
}
