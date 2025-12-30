import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * DTO PARA ABRIR CAJA
 *
 * Validaciones:
 * - Monto inicial requerido, debe ser positivo
 * - Máximo 2 decimales
 * - Mínimo 0 (puede abrirse con 0)
 *
 * NOTA: empresaId y usuarioId NO se incluyen (se toman del JWT/Request)
 */
export class AbrirCajaDto {
  @ApiProperty({
    description: 'Monto inicial con el que se abre la caja',
    example: 1000.0,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto inicial debe tener máximo 2 decimales' },
  )
  @Min(0, { message: 'El monto inicial no puede ser negativo' })
  montoInicial: number;
}
