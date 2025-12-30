import { IsNumber, IsEnum, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago } from '../../enums/metodo-pago.enum';

/**
 * DTO para generar una venta desde una cotización
 * Permite especificar el pago inicial y método de pago
 */
export class GenerarVentaDesdeCotizacionDto {
  @ApiProperty({
    description: 'Monto pagado inicial (puede ser 0 si es a crédito)',
    example: 1000.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoPagado: number;

  @ApiPropertyOptional({
    description: 'Método de pago (requerido si montoPagado > 0)',
    enum: MetodoPago,
    example: MetodoPago.EFECTIVO,
  })
  @ValidateIf((o: GenerarVentaDesdeCotizacionDto) => o.montoPagado > 0)
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;
}
