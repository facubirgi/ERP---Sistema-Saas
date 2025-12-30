import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { TipoTercero } from '../../enums';

/**
 * DTO: Actualizar Tercero
 *
 * Define los datos que se pueden actualizar de un tercero existente.
 *
 * Reglas:
 * - Todos los campos son opcionales (PATCH)
 * - Solo se actualizan los campos enviados
 * - No se puede actualizar el saldoActual manualmente (se calcula automáticamente)
 * - No se puede cambiar el empresaId (multi-tenancy)
 */
export class ActualizarTerceroDto {
  @ApiProperty({
    description: 'Nombre del tercero',
    example: 'Juan Pérez Actualizado',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  nombre?: string;

  @ApiProperty({
    description: 'Dirección del tercero',
    example: 'Calle Nueva 123, Ciudad',
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
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoTercero, {
    message: `El tipo debe ser uno de: ${Object.values(TipoTercero).join(', ')}`,
  })
  tipo?: TipoTercero;
}
