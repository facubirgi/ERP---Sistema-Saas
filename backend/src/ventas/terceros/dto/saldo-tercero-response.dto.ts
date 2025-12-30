import { ApiProperty } from '@nestjs/swagger';

export class SaldoTerceroResponseDto {
  @ApiProperty({ example: 'Juan Pérez' })
  clienteNombre: string;

  @ApiProperty({ example: 150.5, description: 'Saldo actual del cliente' })
  saldoTotal: number;

  @ApiProperty({
    example: 'DEUDOR',
    enum: ['DEUDOR', 'AL_DIA'],
    description: 'Estado del cliente según su saldo',
  })
  estado: string;
}
