import { ApiProperty } from '@nestjs/swagger';
import { MetodoPago } from '../enums';

/**
 * DTO PARA COBRO INDIVIDUAL EN EXPORTACIÓN
 *
 * Representa un cobro individual con información completa
 * para exportación.
 */
export class CobroExportDto {
  @ApiProperty({
    description: 'ID del cobro',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Fecha y hora del cobro',
    example: '2025-12-01T14:30:00.000Z',
  })
  fecha: Date;

  @ApiProperty({
    description: 'Monto del cobro',
    example: 450.5,
  })
  monto: number;

  @ApiProperty({
    description: 'Método de pago utilizado',
    enum: MetodoPago,
    example: MetodoPago.EFECTIVO,
  })
  metodo: MetodoPago;

  @ApiProperty({
    description: 'Información del comprobante asociado',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      total: 1500.0,
    },
  })
  comprobante: {
    id: string;
    total: number;
  };

  @ApiProperty({
    description: 'Información del cliente (null si es venta anónima)',
    example: { nombre: 'Juan Pérez' },
    nullable: true,
  })
  cliente: {
    nombre: string;
  } | null;

  @ApiProperty({
    description: 'Usuario que registró la venta',
    example: { id: '550e8400-e29b-41d4-a716-446655440000', nombre: 'Carlos López' },
    nullable: true,
    required: false,
  })
  usuario?: {
    id: string;
    nombre: string;
  } | null;
}

/**
 * DTO PARA RESUMEN DE COBROS POR MÉTODO DE PAGO
 */
export class ResumenPorMetodoDto {
  @ApiProperty({
    description: 'Total de cobros en efectivo',
    example: 5420.0,
  })
  EFECTIVO: number;

  @ApiProperty({
    description: 'Total de cobros con QR',
    example: 2150.0,
  })
  QR: number;

  @ApiProperty({
    description: 'Total de cobros con tarjeta',
    example: 3800.0,
  })
  TARJETA: number;

  @ApiProperty({
    description: 'Total de cobros con transferencia',
    example: 980.0,
  })
  TRANSFERENCIA: number;
}

/**
 * DTO PARA INFORMACIÓN DE LA SESIÓN DE CAJA
 */
export class SesionInfoDto {
  @ApiProperty({
    description: 'ID de la sesión de caja',
    example: '789e0123-e45b-67c8-d901-234567890abc',
  })
  id: string;

  @ApiProperty({
    description: 'Fecha y hora de apertura de la sesión',
    example: '2025-12-01T08:30:00.000Z',
  })
  fechaApertura: Date;

  @ApiProperty({
    description: 'Fecha y hora de consulta (NOW)',
    example: '2025-12-01T15:45:00.000Z',
  })
  fechaConsulta: Date;

  @ApiProperty({
    description: 'Estado de la sesión',
    example: 'ABIERTA',
  })
  estado: string;
}

/**
 * DTO PARA RESUMEN DE EXPORTACIÓN DE COBROS
 */
export class ResumenCobrosDto {
  @ApiProperty({
    description: 'Cantidad total de cobros',
    example: 15,
  })
  totalCobros: number;

  @ApiProperty({
    description: 'Monto total de todos los cobros',
    example: 12350.0,
  })
  totalMonto: number;

  @ApiProperty({
    description: 'Totales agrupados por método de pago',
    type: ResumenPorMetodoDto,
  })
  porMetodo: ResumenPorMetodoDto;
}

/**
 * DTO PRINCIPAL PARA RESPUESTA DE EXPORTACIÓN DE COBROS
 *
 * Contiene toda la información necesaria para exportar cobros
 * de una sesión de caja activa.
 */
export class ExportarCobrosResponseDto {
  @ApiProperty({
    description: 'Información de la sesión de caja',
    type: SesionInfoDto,
  })
  sesion: SesionInfoDto;

  @ApiProperty({
    description: 'Lista de cobros realizados en la sesión',
    type: [CobroExportDto],
  })
  cobros: CobroExportDto[];

  @ApiProperty({
    description: 'Resumen de totales',
    type: ResumenCobrosDto,
  })
  resumen: ResumenCobrosDto;
}
