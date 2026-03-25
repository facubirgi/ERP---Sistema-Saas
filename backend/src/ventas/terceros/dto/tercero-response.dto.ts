import { ApiProperty } from '@nestjs/swagger';
import { TipoTercero } from '../../enums';

/**
 * DTO: Response de Tercero
 *
 * Define la estructura de respuesta para un tercero.
 * Incluye información básica y el saldo actual.
 */
export class TerceroResponseDto {
  @ApiProperty({
    description: 'ID del tercero',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del tercero',
    example: 'Juan Pérez',
  })
  nombre: string;

  @ApiProperty({
    description: 'Dirección del tercero',
    example: 'Av. Siempre Viva 742, Springfield',
    required: false,
  })
  direccion: string | null;

  @ApiProperty({
    description: 'Tipo de tercero',
    enum: TipoTercero,
    example: TipoTercero.CLIENTE,
  })
  tipo: TipoTercero;

  @ApiProperty({
    description: 'Saldo actual de cuenta corriente',
    example: 250.0,
  })
  saldoActual: number;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-11-21T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-11-21T15:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Usuario que creó el tercero',
    required: false,
    nullable: true,
  })
  usuario?: { id: string; nombre: string } | null;
}
