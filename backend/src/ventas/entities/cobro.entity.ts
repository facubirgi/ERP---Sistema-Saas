import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Empresa } from '../../tenant/entities/empresa.entity';
import { MetodoPago } from '../enums';
import { Comprobante } from './comprobante.entity';

/**
 * ENTIDAD COBRO
 *
 * Representa un pago/cobro asociado a un comprobante de venta.
 *
 * Características clave:
 * - UUID como PK
 * - Multi-tenant (empresaId)
 * - NO tiene soft delete (los cobros no se "eliminan", se reversan con otro cobro negativo)
 * - Relación OBLIGATORIA con Comprobante (CASCADE si se elimina el comprobante)
 * - Métodos de pago: EFECTIVO, QR, TARJETA, TRANSFERENCIA
 * - Fecha de cobro para reportes de caja
 * - Un comprobante puede tener múltiples cobros (pagos parciales)
 */
@Entity('cobro')
@Index(['empresaId']) // Filtros por tenant
@Index(['comprobanteId']) // Búsquedas por comprobante
@Index(['empresaId', 'fecha']) // Reportes de caja por fecha
export class Cobro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Monto del cobro
   * - Precision: 12 dígitos, 2 decimales
   * - Positivo: cobro/ingreso
   * - Negativo: devolución/egreso (reversión)
   * - Transformer: Convierte string de BD a number en JS
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  monto: number;

  /**
   * Fecha del cobro
   * Puede ser diferente a la fecha de creación (created_at)
   * Útil para reportes de caja y movimientos bancarios
   */
  @Column({ type: 'timestamp' })
  fecha: Date;

  /**
   * Método de pago utilizado
   * - EFECTIVO: Pago en efectivo
   * - QR: Pago mediante código QR
   * - TARJETA: Pago con tarjeta
   * - TRANSFERENCIA: Transferencia bancaria
   */
  @Column({
    type: 'enum',
    enum: MetodoPago,
  })
  metodo: MetodoPago;

  // RELACIÓN CON COMPROBANTE (OBLIGATORIA)
  @Column({ type: 'uuid', name: 'comprobante_id' })
  comprobanteId: string;

  /**
   * onDelete: 'CASCADE'
   * Si se elimina el comprobante, todos sus cobros se eliminan también
   * La relación es fuerte: un cobro no puede existir sin su comprobante
   */
  @ManyToOne(() => Comprobante, (comprobante) => comprobante.cobros, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comprobante_id' })
  comprobante: Comprobante;

  // RELACIÓN CON EMPRESA (Multi-tenancy)
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
