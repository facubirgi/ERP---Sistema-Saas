import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { MetodoPago } from '../enums';

/**
 * DTO: Actualizar Cobro
 *
 * Define los datos que se pueden actualizar de un cobro existente.
 *
 * Reglas:
 * - Solo permite actualizar el método de pago y la fecha
 * - NO se puede actualizar el monto (esto afectaría los saldos y requeriría recálculos complejos)
 * - Para corregir un monto, se debe hacer una reversión con un cobro negativo
 *
 * Casos de uso:
 * - Corregir el método de pago capturado incorrectamente
 * - Ajustar la fecha del cobro (ej: si se registró en el sistema un día después)
 */
export class ActualizarCobroDto {
  @ApiProperty({
    description: 'Método de pago',
    enum: MetodoPago,
    example: MetodoPago.EFECTIVO,
    required: false,
  })
  @IsOptional()
  @IsEnum(MetodoPago, {
    message: `El método de pago debe ser uno de: ${Object.values(MetodoPago).join(', ')}`,
  })
  metodoPago?: MetodoPago;

  @ApiProperty({
    description:
      'Fecha del cobro (formato ISO 8601: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)',
    example: '2025-11-24T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha debe estar en formato ISO 8601 válido' },
  )
  fecha?: string;
}
