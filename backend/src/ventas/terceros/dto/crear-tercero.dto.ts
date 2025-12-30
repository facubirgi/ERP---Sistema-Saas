import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { TipoTercero } from '../../enums';

/**
 * DTO: Crear Tercero
 *
 * Define los datos necesarios para registrar un nuevo tercero (cliente o proveedor).
 *
 * Reglas de validación:
 * - El nombre es obligatorio y no puede exceder 200 caracteres
 * - La dirección es opcional y no puede exceder 300 caracteres
 * - El tipo debe ser CLIENTE o PROVEEDOR
 * - El saldoActual se inicializa automáticamente en 0
 * - El empresaId se toma del token JWT
 */
export class CrearTerceroDto {
  @ApiProperty({
    description: 'Nombre del tercero (cliente o proveedor)',
    example: 'Juan Pérez',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Dirección del tercero',
    example: 'Av. Siempre Viva 742, Springfield',
    maxLength: 300,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser un texto' })
  @MaxLength(300, { message: 'La dirección no puede exceder 300 caracteres' })
  direccion?: string;

  @ApiProperty({
    description: 'Tipo de tercero',
    enum: TipoTercero,
    example: TipoTercero.CLIENTE,
  })
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  @IsEnum(TipoTercero, {
    message: `El tipo debe ser uno de: ${Object.values(TipoTercero).join(', ')}`,
  })
  tipo: TipoTercero;
}
