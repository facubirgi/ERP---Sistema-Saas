import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsNumber,
  Min,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemVentaDto } from './item-venta.dto';
import { MetodoPago } from '../enums';

/**
 * DTO: Crear Venta
 *
 * Define los datos necesarios para registrar una nueva venta.
 *
 * Reglas de validación:
 * - Si clienteId es null, la venta es anónima y debe pagarse completa
 * - Si montoPagado > 0, metodoPago es obligatorio
 * - Debe tener al menos un item en la venta
 */
export class CrearVentaDto {
  @ApiProperty({
    description:
      'ID del cliente (opcional). Si no se proporciona, será una venta anónima',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El clienteId debe ser un UUID válido' })
  clienteId?: string;

  @ApiProperty({
    description: 'Lista de items de la venta',
    type: [ItemVentaDto],
    example: [
      {
        productoId: '123e4567-e89b-12d3-a456-426614174001',
        cantidad: 2,
        precioUnitario: 100.0,
      },
      {
        productoId: '123e4567-e89b-12d3-a456-426614174002',
        cantidad: 1,
        precioUnitario: 250.5,
      },
    ],
  })
  @IsArray({ message: 'Los items deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => ItemVentaDto)
  @ArrayMinSize(1, { message: 'Debe incluir al menos un item en la venta' })
  items: ItemVentaDto[];

  @ApiProperty({
    description: 'Monto pagado al momento de la venta',
    example: 350.5,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto pagado debe ser un número válido' },
  )
  @Min(0, { message: 'El monto pagado no puede ser negativo' })
  montoPagado: number;

  @ApiProperty({
    description:
      'Método de pago (requerido cuando montoPagado > 0, opcional cuando montoPagado = 0)',
    enum: MetodoPago,
    example: MetodoPago.EFECTIVO,
    required: false,
  })
  @ValidateIf((o: CrearVentaDto) => o.montoPagado > 0)
  @IsEnum(MetodoPago, {
    message: `El método de pago debe ser uno de: ${Object.values(MetodoPago).join(', ')}`,
  })
  metodoPago?: MetodoPago;
}
