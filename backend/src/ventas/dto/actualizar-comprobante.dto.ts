import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

/**
 * DTO: Actualizar Comprobante
 *
 * Define los datos que se pueden actualizar de un comprobante existente.
 *
 * Reglas:
 * - Solo permite actualizar el terceroId (asignar/cambiar cliente)
 * - NO se puede actualizar: total, saldoPendiente, estadoPago (se calculan automáticamente)
 * - NO se puede actualizar: tipo (un comprobante no cambia de tipo una vez creado)
 * - Para modificar items o montos, se deben hacer ajustes con nuevos comprobantes
 *
 * Casos de uso:
 * - Asignar un cliente a una venta anónima
 * - Cambiar el cliente de una venta
 * - Convertir una venta de cliente a anónima (terceroId = null)
 */
export class ActualizarComprobanteDto {
  @ApiProperty({
    description:
      'ID del cliente. Puede ser null para convertir en venta anónima. IMPORTANTE: Solo se puede cambiar si el comprobante no tiene saldo pendiente.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El terceroId debe ser un UUID válido' })
  terceroId?: string | null;
}
