import { ApiProperty } from '@nestjs/swagger';
import { EstadoPago, TipoComprobante, MetodoPago } from '../enums';

/**
 * DTO: Comprobante Response (simplificado)
 *
 * Representación simplificada de un comprobante en la respuesta.
 */
class ComprobanteSimpleDto {
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
    description: 'Total del comprobante',
    example: 450.5,
  })
  total: number;

  @ApiProperty({
    description: 'Saldo pendiente',
    example: 100.0,
  })
  saldoPendiente: number;

  @ApiProperty({
    description: 'Estado de pago',
    enum: EstadoPago,
    example: EstadoPago.PARCIAL,
  })
  estadoPago: EstadoPago;
}

/**
 * DTO: Cobro Response (simplificado)
 *
 * Representación simplificada de un cobro en la respuesta.
 */
class CobroSimpleDto {
  @ApiProperty({
    description: 'ID del cobro',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Monto del cobro',
    example: 350.5,
  })
  monto: number;

  @ApiProperty({
    description: 'Método de pago',
    enum: MetodoPago,
    example: MetodoPago.EFECTIVO,
  })
  metodo: MetodoPago;
}

/**
 * DTO: Venta Response
 *
 * Respuesta al registrar una venta.
 * Incluye el comprobante creado, el cobro inicial (si lo hubo) y un mensaje descriptivo.
 */
export class VentaResponseDto {
  @ApiProperty({
    description: 'Datos del comprobante creado',
    type: ComprobanteSimpleDto,
  })
  comprobante: ComprobanteSimpleDto;

  @ApiProperty({
    description: 'Datos del cobro inicial (null si no hubo pago)',
    type: CobroSimpleDto,
    nullable: true,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      monto: 350.5,
      metodo: MetodoPago.EFECTIVO,
    },
  })
  cobro: CobroSimpleDto | null;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Venta registrada exitosamente. Saldo pendiente: $100.00',
  })
  mensaje: string;
}
