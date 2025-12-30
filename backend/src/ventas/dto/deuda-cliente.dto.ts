import { ApiProperty } from '@nestjs/swagger';
import { EstadoPago } from '../enums';

/**
 * DTO: Deuda Cliente
 *
 * Representa una deuda pendiente de un cliente.
 * Se usa para mostrar la cuenta corriente de un cliente.
 */
export class DeudaClienteDto {
  @ApiProperty({
    example: 'uuid-comprobante',
    description: 'ID del comprobante',
  })
  id: string;

  @ApiProperty({
    example: '2025-11-21T10:00:00.000Z',
    description: 'Fecha del comprobante',
  })
  fecha: Date;

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
}
