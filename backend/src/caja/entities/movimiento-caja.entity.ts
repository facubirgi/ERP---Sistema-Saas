import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Empresa } from '../../tenant/entities/empresa.entity';
import { TipoMovimiento, OrigenMovimiento, MetodoPagoCaja } from '../enums';
import { CajaSesion } from './caja-sesion.entity';

/**
 * ENTIDAD MOVIMIENTO CAJA
 *
 * Representa un movimiento individual de dinero en una sesión de caja.
 *
 * Características clave:
 * - UUID como PK
 * - Multi-tenant (empresaId)
 * - Relación ManyToOne con CajaSesion
 * - Tipo: INGRESO o EGRESO
 * - Origen: APERTURA, VENTA, GASTO, etc.
 * - Método de pago: EFECTIVO, QR, TRANSFERENCIA, OTRO
 * - Registro cronológico de todos los movimientos de caja
 */
@Entity('movimiento_caja')
@Index(['empresaId']) // Filtros por tenant
@Index(['sesionId']) // Búsquedas por sesión
@Index(['empresaId', 'fecha']) // Para reportes diarios
@Index(['empresaId', 'tipo']) // Filtros por tipo de movimiento
export class MovimientoCaja {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RELACIÓN CON SESIÓN DE CAJA
  @Column({ type: 'uuid', name: 'sesion_id' })
  sesionId: string;

  /**
   * onDelete: 'CASCADE'
   * Si se elimina la sesión, todos sus movimientos se eliminan también
   */
  @ManyToOne(() => CajaSesion, (sesion) => sesion.movimientos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sesion_id' })
  sesion: CajaSesion;

  /**
   * Fecha y hora del movimiento
   * - Se registra automáticamente al crear el movimiento
   * - Permite ordenamiento cronológico
   */
  @Column({ type: 'timestamp' })
  fecha: Date;

  /**
   * Monto del movimiento
   * - Precision: 12 dígitos, 2 decimales
   * - Siempre positivo (el signo lo determina el tipo)
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
   * Tipo de movimiento
   * - INGRESO: Entrada de dinero (suma al saldo)
   * - EGRESO: Salida de dinero (resta al saldo)
   */
  @Column({
    type: 'enum',
    enum: TipoMovimiento,
  })
  tipo: TipoMovimiento;

  /**
   * Origen/Motivo del movimiento
   * - APERTURA: Movimiento inicial al abrir caja
   * - VENTA: Cobro proveniente de una venta
   * - GASTO: Gasto operativo
   * - RETIRO: Retiro de efectivo
   * - DEPOSITO: Depósito adicional
   * - DEVOLUCION: Devolución a cliente
   * - AJUSTE: Ajuste por diferencia en arqueo
   */
  @Column({
    type: 'enum',
    enum: OrigenMovimiento,
  })
  origen: OrigenMovimiento;

  /**
   * Método de pago utilizado
   * - EFECTIVO: Dinero en efectivo físico
   * - QR: Pago mediante código QR (Mercado Pago, etc.)
   * - TRANSFERENCIA: Transferencia bancaria
   * - OTRO: Otros métodos de pago
   *
   * IMPORTANTE: Solo los movimientos en EFECTIVO afectan el arqueo de caja.
   * Los otros métodos se registran para control pero no entran en el conteo físico.
   */
  @Column({
    type: 'enum',
    enum: MetodoPagoCaja,
    name: 'metodo_pago',
  })
  metodoPago: MetodoPagoCaja;

  /**
   * Descripción del movimiento
   * - Texto libre para detallar el concepto
   * - Ejemplos: "Cobro venta #12345", "Pago luz", "Retiro para banco"
   * - Máximo 500 caracteres
   */
  @Column({ type: 'varchar', length: 500 })
  descripcion: string;

  // RELACIÓN CON EMPRESA (Multi-tenancy)
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
