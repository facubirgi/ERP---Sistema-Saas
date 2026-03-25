import { ApiProperty } from '@nestjs/swagger';
import { TipoComprobante, EstadoPago, MetodoPago } from '../enums';
import { DetalleItemDto } from './detalle-item.dto';

/**
 * DTO: Detalle Venta Response
 *
 * Respuesta completa del detalle de una venta.
 * Incluye información del comprobante, cliente, items y cobros.
 */
export class DetalleVentaResponseDto {
  @ApiProperty({
    example: 'uuid-comprobante',
    description: 'ID del comprobante',
  })
  id: string;

  @ApiProperty({
    enum: TipoComprobante,
    example: TipoComprobante.VENTA,
    description: 'Tipo de comprobante',
  })
  tipo: TipoComprobante;

  @ApiProperty({
    example: 150.0,
    description: 'Total del comprobante',
  })
  total: number;

  @ApiProperty({
    example: 50.0,
    description: 'Saldo pendiente de pago',
  })
  saldoPendiente: number;

  @ApiProperty({
    enum: EstadoPago,
    example: EstadoPago.PARCIAL,
    description: 'Estado de pago del comprobante',
  })
  estadoPago: EstadoPago;

  @ApiProperty({
    required: false,
    description: 'Información del cliente (si existe)',
    example: {
      id: 'uuid-cliente',
      nombre: 'Juan Pérez',
    },
  })
  tercero?: {
    id: string;
    nombre: string;
  };

  @ApiProperty({
    type: [DetalleItemDto],
    description: 'Items vendidos en el comprobante',
  })
  detalles: DetalleItemDto[];

  @ApiProperty({
    description: 'Usuario que registró la venta',
    required: false,
    example: {
      id: 'uuid-usuario',
      nombre: 'Carlos López',
    },
  })
  usuario?: {
    id: string;
    nombre: string;
  };

  @ApiProperty({
    type: [Object],
    description: 'Historial de cobros realizados',
    example: [
      {
        id: 'uuid-cobro',
        monto: 100.0,
        metodo: MetodoPago.EFECTIVO,
        fecha: '2025-11-21T10:00:00.000Z',
      },
    ],
  })
  cobros: {
    id: string;
    monto: number;
    metodo: MetodoPago;
    fecha: Date;
  }[];

  @ApiProperty({
    example: '2025-11-21T10:00:00.000Z',
    description: 'Fecha de creación del comprobante',
  })
  createdAt: Date;
}
