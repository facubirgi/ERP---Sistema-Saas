import { PartialType } from '@nestjs/swagger';
import { CreateCategoriaDto } from './create-categoria.dto';

/**
 * DTO PARA ACTUALIZAR CATEGORÍA
 *
 * Hace todos los campos opcionales usando PartialType de Swagger.
 * Mantiene las validaciones del CreateDto cuando los campos están presentes.
 */
export class UpdateCategoriaDto extends PartialType(CreateCategoriaDto) {}
