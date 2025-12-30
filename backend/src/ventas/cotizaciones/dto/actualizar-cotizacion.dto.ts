import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemCotizacionDto } from './item-cotizacion.dto';

/**
 * DTO para actualizar una cotización
 */
export class ActualizarCotizacionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  clienteNombre?: string;

  @IsOptional()
  @IsUUID('4')
  clienteId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCotizacionDto)
  items?: ItemCotizacionDto[];
}
