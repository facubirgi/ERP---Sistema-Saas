import { ApiProperty } from '@nestjs/swagger';
import { TipoComprobante, EstadoPago } from '../enums';

/**
 * DTO: Item de Venta para Listado
 *
 * Define la estructura de respuesta para cada venta en el listado.
 * Incluye información resumida (sin detalles de productos ni cobros).
 */
export class VentaListItemDto {
  @ApiProperty({
    description: 'ID del comprobante',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Tipo de comprobante',
    enum: TipoComprobante,
    example: TipoComprobante.VENTA,
  })
  tipo: TipoComprobante;

  @ApiProperty({
    description: 'Total de la venta',
    example: 350.5,
  })
  total: number;

  @ApiProperty({
    description: 'Saldo pendiente de pago',
    example: 100.0,
  })
  saldoPendiente: number;

  @ApiProperty({
    description: 'Estado de pago',
    enum: EstadoPago,
    example: EstadoPago.PARCIAL,
  })
  estadoPago: EstadoPago;

  @ApiProperty({
    description: 'Información del cliente (si existe)',
    required: false,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      nombre: 'Juan Pérez',
    },
  })
  tercero?: {
    id: string;
    nombre: string;
  };

  @ApiProperty({
    description: 'Cantidad de items en la venta',
    example: 3,
  })
  cantidadItems: number;

  @ApiProperty({
    description: 'Fecha de creación de la venta',
    example: '2025-11-21T10:00:00Z',
  })
  createdAt: Date;
}
