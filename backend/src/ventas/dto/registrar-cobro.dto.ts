import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min, IsEnum } from 'class-validator';
import { MetodoPago } from '../enums';

/**
 * DTO: Registrar Cobro
 *
 * Define los datos necesarios para registrar un cobro diferido
 * sobre un comprobante existente.
 *
 * Se utiliza para pagos parciales o posteriores a la venta inicial.
 */
export class RegistrarCobroDto {
  @ApiProperty({
    description: 'ID del comprobante al que se asocia el cobro',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'El comprobanteId debe ser un UUID válido' })
  comprobanteId: string;

  @ApiProperty({
    description: 'Monto del cobro',
    example: 100.0,
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe ser un número válido' },
  )
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @ApiProperty({
    description: 'Método de pago utilizado',
    enum: MetodoPago,
    example: MetodoPago.TRANSFERENCIA,
  })
  @IsEnum(MetodoPago, {
    message: `El método de pago debe ser uno de: ${Object.values(MetodoPago).join(', ')}`,
  })
  metodoPago: MetodoPago;
}
