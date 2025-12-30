import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EstadoCaja } from '../enums';
import { CajaSesion } from '../entities/caja-sesion.entity';

/**
 * DTO DE RESPUESTA PARA SESIÓN DE CAJA
 *
 * Garantiza que todos los campos se serialicen correctamente
 * y previene problemas con el ClassSerializerInterceptor global.
 */
export class SesionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: '456e7890-e21b-12d3-a456-426614174000' })
  @Expose()
  empresaId: string;

  @ApiProperty({ example: 1000.0 })
  @Expose()
  montoInicial: number;

  @ApiProperty({ example: 1250.5, nullable: true })
  @Expose()
  montoFinalSistema: number | null;

  @ApiProperty({ example: 1245.0, nullable: true })
  @Expose()
  montoFinalReal: number | null;

  @ApiProperty({ example: -5.5, nullable: true })
  @Expose()
  diferencia: number | null;

  @ApiProperty({ example: '2025-12-01T08:00:00.000Z' })
  @Expose()
  fechaApertura: string;

  @ApiProperty({ example: '2025-12-01T18:00:00.000Z', nullable: true })
  @Expose()
  fechaCierre: string | null;

  @ApiProperty({ enum: EstadoCaja, example: EstadoCaja.ABIERTA })
  @Expose()
  estado: EstadoCaja;

  @ApiProperty({ example: '987e6543-e21b-12d3-a456-426614174000' })
  @Expose()
  usuarioId: string;

  @ApiProperty({ example: '2025-12-01T08:00:00.000Z' })
  @Expose()
  createdAt: string;

  @ApiProperty({ example: '2025-12-01T08:00:00.000Z' })
  @Expose()
  updatedAt: string;

  /**
   * Constructor que mapea una entidad CajaSesion a un DTO
   */
  static fromEntity(entity: CajaSesion): SesionResponseDto {
    const dto = new SesionResponseDto();
    dto.id = entity.id;
    dto.empresaId = entity.empresaId;
    dto.montoInicial = entity.montoInicial;
    dto.montoFinalSistema = entity.montoFinalSistema;
    dto.montoFinalReal = entity.montoFinalReal;
    dto.diferencia = entity.diferencia;
    dto.fechaApertura = entity.fechaApertura?.toISOString();
    dto.fechaCierre = entity.fechaCierre?.toISOString() || null;
    dto.estado = entity.estado; // ✅ Aseguramos que el estado se incluya
    dto.usuarioId = entity.usuarioId;
    dto.createdAt = entity.createdAt?.toISOString();
    dto.updatedAt = entity.updatedAt?.toISOString();
    return dto;
  }
}
