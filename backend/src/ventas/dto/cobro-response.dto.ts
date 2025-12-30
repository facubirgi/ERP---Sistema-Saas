import { ApiProperty } from '@nestjs/swagger';
import { EstadoPago, MetodoPago } from '../enums';

/**
 * DTO: Cobro Detalle
 *
 * Representación detallada de un cobro en la respuesta.
 */
class CobroDetalleDto {
  @ApiProperty({
    description: 'ID del cobro',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Monto del cobro',
    example: 100.0,
  })
  monto: number;

  @ApiProperty({
    description: 'Método de pago',
    enum: MetodoPago,
    example: MetodoPago.TRANSFERENCIA,
  })
  metodo: MetodoPago;

  @ApiProperty({
    description: 'Fecha del cobro',
    example: '2025-11-21T10:30:00.000Z',
  })
  fecha: Date;
}

/**
 * DTO: Comprobante Estado
 *
 * Representación del estado actualizado del comprobante.
 */
class ComprobanteEstadoDto {
  @ApiProperty({
    description: 'ID del comprobante',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Saldo pendiente actualizado',
    example: 0,
  })
  saldoPendiente: number;

  @ApiProperty({
    description: 'Estado de pago actualizado',
    enum: EstadoPago,
    example: EstadoPago.PAGADO,
  })
  estadoPago: EstadoPago;
}

/**
 * DTO: Cobro Response
 *
 * Respuesta al registrar un cobro diferido.
 * Incluye el cobro creado, el estado actualizado del comprobante y un mensaje descriptivo.
 */
export class CobroResponseDto {
  @ApiProperty({
    description: 'Datos del cobro registrado',
    type: CobroDetalleDto,
  })
  cobro: CobroDetalleDto;

  @ApiProperty({
    description: 'Estado actualizado del comprobante',
    type: ComprobanteEstadoDto,
  })
  comprobante: ComprobanteEstadoDto;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Cobro registrado exitosamente. Comprobante pagado completamente.',
  })
  mensaje: string;
}
