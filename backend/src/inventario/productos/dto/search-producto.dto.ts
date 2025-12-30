import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * DTO PARA BÚSQUEDA HÍBRIDA DE PRODUCTOS
 *
 * Funcionalidad:
 * 1. Busca primero por código de barras EXACTO (prioridad escáner)
 * 2. Si no encuentra, busca por nombre PARCIAL (ILIKE)
 * 3. Soporta paginación para búsquedas por nombre
 *
 * Uso típico en POS:
 * - Escáner envía código completo → match exacto inmediato
 * - Usuario teclea "coca" → lista de coincidencias paginada
 */
export class SearchProductoDto extends PaginationDto {
  @ApiProperty({
    description:
      'Término de búsqueda (código de barras exacto o nombre parcial)',
    example: '7790001234567',
    minLength: 2,
  })
  @IsString({ message: 'El término de búsqueda debe ser texto' })
  @IsNotEmpty({ message: 'El término de búsqueda es obligatorio' })
  @MinLength(2, { message: 'El término debe tener al menos 2 caracteres' })
  termino: string;
}
