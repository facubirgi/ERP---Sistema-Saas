import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO DE RESPUESTA PARA ANULACIÓN DE VENTA
 *
 * Retorna información sobre la venta anulada y el movimiento de devolución creado.
 */
export class AnularVentaResponseDto {
  @ApiProperty({
    description: 'Información del comprobante anulado',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      total: 150.0,
      estadoPago: 'PAGADO',
    },
  })
  comprobante: {
    id: string;
    total: number;
    estadoPago: string;
  };

  @ApiProperty({
    description: 'Información del movimiento de devolución creado en caja',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      monto: 150.0,
      tipo: 'EGRESO',
      origen: 'DEVOLUCION',
    },
    nullable: true,
  })
  movimientoDevolucion: {
    id: string;
    monto: number;
    tipo: string;
    origen: string;
  } | null;

  @ApiProperty({
    description: 'Cantidad de productos cuyo stock fue revertido',
    example: 3,
  })
  productosRevertidos: number;

  @ApiProperty({
    description: 'Monto ajustado en el saldo del cliente (si aplica)',
    example: 0,
    nullable: true,
  })
  saldoClienteAjustado: number | null;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Venta anulada exitosamente. Stock revertido para 3 productos.',
  })
  mensaje: string;
}
