import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * DTO PARA CERRAR CAJA
 *
 * Validaciones:
 * - Monto real efectivo requerido
 * - Máximo 2 decimales
 * - Mínimo 0
 *
 * El sistema calculará automáticamente:
 * - montoFinalSistema (suma de movimientos EFECTIVO)
 * - diferencia (montoRealEfectivo - montoFinalSistema)
 */
export class CerrarCajaDto {
  @ApiProperty({
    description: 'Monto real en efectivo contado físicamente al cerrar la caja',
    example: 1250.5,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto real debe tener máximo 2 decimales' },
  )
  @Min(0, { message: 'El monto real no puede ser negativo' })
  montoRealEfectivo: number;
}
