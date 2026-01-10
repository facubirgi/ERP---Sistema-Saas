import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO: Cliente Moroso
 *
 * Información de un cliente con deuda pendiente.
 */
export class ClienteMorosoDto {
  @ApiProperty({
    description: 'ID del cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  clienteId: string;

  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'Juan Pérez',
  })
  clienteNombre: string;

  @ApiProperty({
    description: 'Saldo total pendiente',
    example: 3500.00,
  })
  saldoTotal: number;

  @ApiProperty({
    description: 'Cantidad de comprobantes pendientes',
    example: 5,
  })
  cantidadComprobantes: number;

  @ApiProperty({
    description: 'Fecha del comprobante más antiguo',
    example: '2025-11-15T10:30:00Z',
  })
  comprobanteMasAntiguo: string;

  @ApiProperty({
    description: 'Días de antigüedad de la deuda',
    example: 56,
  })
  diasVencimiento: number;
}

/**
 * DTO: Cuentas por Cobrar Response
 *
 * Respuesta para el endpoint de cuentas por cobrar.
 * Incluye totales generales y listado de clientes morosos.
 */
export class CuentasPorCobrarResponseDto {
  @ApiProperty({
    description: 'Total general pendiente de cobro',
    example: 15450.00,
  })
  totalGeneral: number;

  @ApiProperty({
    description: 'Cantidad de clientes con deuda',
    example: 23,
  })
  cantidadClientes: number;

  @ApiProperty({
    description: 'Listado de clientes morosos ordenados por saldo',
    type: [ClienteMorosoDto],
  })
  clientesMorosos: ClienteMorosoDto[];

  @ApiProperty({
    description: 'Promedio de deuda por cliente',
    example: 671.74,
  })
  promedioDeuda: number;
}
