import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

/**
 * DTO PARA CREAR CATEGORÍA
 *
 * Validaciones:
 * - Nombre requerido, no vacío
 * - Longitud entre 2 y 100 caracteres
 *
 * NOTA: empresaId NO se incluye (se toma del JWT)
 */
export class CreateCategoriaDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Bebidas',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;
}
