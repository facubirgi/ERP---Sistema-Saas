import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

/**
 * DTO PARA ANULAR UNA VENTA
 *
 * Contiene el motivo obligatorio de la anulación.
 *
 * Validaciones:
 * - Motivo requerido, mínimo 10 caracteres
 * - Máximo 500 caracteres
 */
export class AnularVentaDto {
  @ApiProperty({
    description: 'Motivo de la anulación (mínimo 10 caracteres)',
    example: 'Cliente devolvió el producto por defecto de fábrica',
    minLength: 10,
    maxLength: 500,
  })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El motivo de anulación es obligatorio' })
  @MinLength(10, {
    message: 'El motivo debe tener al menos 10 caracteres',
  })
  @MaxLength(500, {
    message: 'El motivo no puede exceder 500 caracteres',
  })
  motivoAnulacion: string;
}
