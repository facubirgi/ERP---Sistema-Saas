import { IsOptional, IsDateString, IsString } from 'class-validator';

/**
 * DTO para filtros de listado de cotizaciones
 */
export class ListarCotizacionesQueryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsString()
  clienteNombre?: string;
}
