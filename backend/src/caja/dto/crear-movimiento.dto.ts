import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoMovimiento, OrigenMovimiento, MetodoPagoCaja } from '../enums';

/**
 * DTO PARA CREAR MOVIMIENTO DE CAJA
 *
 * Validaciones:
 * - Todos los campos son obligatorios
 * - Monto positivo con máximo 2 decimales
 * - Descripción entre 1 y 500 caracteres
 *
 * NOTA: sesionId se pasa como parámetro de ruta
 * NOTA: empresaId se toma del JWT/Request
 * NOTA: fecha se genera automáticamente en el servicio
 */
export class CrearMovimientoDto {
  @ApiProperty({
    description: 'Tipo de movimiento',
    enum: TipoMovimiento,
    example: TipoMovimiento.INGRESO,
  })
  @IsEnum(TipoMovimiento, {
    message: 'El tipo debe ser INGRESO o EGRESO',
  })
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  tipo: TipoMovimiento;

  @ApiProperty({
    description: 'Origen/motivo del movimiento',
    enum: OrigenMovimiento,
    example: OrigenMovimiento.VENTA,
  })
  @IsEnum(OrigenMovimiento, {
    message:
      'El origen debe ser: APERTURA, VENTA, GASTO, RETIRO, DEPOSITO, DEVOLUCION o AJUSTE',
  })
  @IsNotEmpty({ message: 'El origen es obligatorio' })
  origen: OrigenMovimiento;

  @ApiProperty({
    description: 'Método de pago',
    enum: MetodoPagoCaja,
    example: MetodoPagoCaja.EFECTIVO,
  })
  @IsEnum(MetodoPagoCaja, {
    message: 'El método de pago debe ser: EFECTIVO, QR, TRANSFERENCIA u OTRO',
  })
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  metodoPago: MetodoPagoCaja;

  @ApiProperty({
    description: 'Monto del movimiento',
    example: 150.5,
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe tener máximo 2 decimales' },
  )
  @Min(0.01, { message: 'El monto mínimo es 0.01' })
  monto: number;

  @ApiProperty({
    description: 'Descripción del movimiento',
    example: 'Cobro venta #12345',
    maxLength: 500,
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(500, {
    message: 'La descripción no puede exceder 500 caracteres',
  })
  descripcion: string;
}
