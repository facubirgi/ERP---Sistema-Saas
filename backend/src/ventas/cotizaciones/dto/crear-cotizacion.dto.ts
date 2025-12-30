import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsDate,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemCotizacionDto } from './item-cotizacion.dto';

/**
 * DTO para crear una cotización
 */
export class CrearCotizacionDto {
  /**
   * Nombre del cliente (anónimo o del sistema)
   */
  @IsString()
  @MinLength(2, {
    message: 'El nombre del cliente debe tener al menos 2 caracteres',
  })
  clienteNombre: string;

  /**
   * ID del tercero (opcional, si es cliente del sistema)
   */
  @IsOptional()
  @IsUUID('4', { message: 'El ID del tercero debe ser un UUID válido' })
  clienteId?: string;

  /**
   * Items de la cotización
   */
  @IsArray({ message: 'Los items deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => ItemCotizacionDto)
  items: ItemCotizacionDto[];

  /**
   * Fecha de emisión de la cotización
   */
  @IsDate({ message: 'La fecha de emisión debe ser una fecha válida' })
  @Type(() => Date)
  fechaEmision: Date;
}
