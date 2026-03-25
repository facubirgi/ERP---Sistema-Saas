import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Empresa } from '../../tenant/entities/empresa.entity';
import { Usuario } from '../../tenant/entities/usuario.entity';
import { TipoComprobante, EstadoPago } from '../enums';
import { Tercero } from './tercero.entity';
import { Cobro } from './cobro.entity';
import { ComprobanteDetalle } from './comprobante-detalle.entity';

/**
 * ENTIDAD COMPROBANTE
 *
 * Representa un comprobante de venta en el sistema.
 *
 * Características clave:
 * - UUID como PK
 * - Multi-tenant (empresaId)
 * - Soft Delete (eliminado, deletedAt)
 * - Tipo: VENTA
 * - Control de pagos: total, saldoPendiente, estadoPago
 * - Relación OPCIONAL con Tercero (SET NULL si se elimina el tercero)
 * - Relación con múltiples cobros
 * - Los cobros se eliminan en cascada si se elimina el comprobante
 */
@Entity('comprobante')
@Index(['empresaId']) // Filtros por tenant
@Index(['empresaId', 'tipo']) // Filtros por tipo de comprobante
@Index(['empresaId', 'estadoPago']) // Filtros por estado de pago
@Index(['terceroId']) // Búsquedas por tercero (cuenta corriente)
export class Comprobante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Tipo de comprobante: VENTA o COTIZACION
   * - VENTA: Comprobante confirmado con impacto en stock y cuentas
   * - COTIZACION: Presupuesto sin impacto en stock ni movimientos
   */
  @Column({
    type: 'enum',
    enum: TipoComprobante,
  })
  tipo: TipoComprobante;

  /**
   * Número de comprobante correlativo
   * - Formato: COT-0001, COT-0002, etc.
   * - Solo para COTIZACION
   * - Generado automáticamente por empresa
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'numero_comprobante',
  })
  numeroComprobante: string | null;

  /**
   * Fecha de vencimiento de la cotización
   * - Solo para COTIZACION
   * - Se calcula como: fechaEmision + 15 días
   */
  @Column({ type: 'timestamp', nullable: true, name: 'fecha_vencimiento' })
  fechaVencimiento: Date | null;

  /**
   * Usuario que emite el comprobante
   * - Nombre del usuario del sistema
   * - Solo para COTIZACION
   */
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'usuario_emisor',
  })
  usuarioEmisor: string | null;

  /**
   * Indica si la cotización fue convertida a venta
   * - Solo aplica para tipo COTIZACION
   * - Se marca como true cuando se genera una venta desde esta cotización
   * - Permite identificar cotizaciones que ya fueron procesadas
   */
  @Column({ type: 'boolean', default: false, name: 'convertida_a_venta' })
  convertidaAVenta: boolean;

  /**
   * Total del comprobante
   * - Precision: 12 dígitos, 2 decimales
   * - Suma de todos los items del comprobante
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
  total: number;

  /**
   * Saldo pendiente de pago
   * - Precision: 12 dígitos, 2 decimales
   * - Se calcula como: total - suma(cobros)
   * - Se actualiza automáticamente al registrar cobros
   * - Transformer: Convierte string de BD a number en JS
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'saldo_pendiente',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  saldoPendiente: number;

  /**
   * Estado de pago del comprobante
   * - PENDIENTE: No se ha registrado ningún pago
   * - PARCIAL: Se ha pagado parcialmente
   * - PAGADO: Pago completo
   * Se actualiza automáticamente según saldoPendiente
   */
  @Column({
    type: 'enum',
    enum: EstadoPago,
    default: EstadoPago.PENDIENTE,
    name: 'estado_pago',
  })
  estadoPago: EstadoPago;

  // RELACIÓN CON TERCERO (OPCIONAL)
  @Column({ type: 'uuid', nullable: true, name: 'tercero_id' })
  terceroId: string | null;

  /**
   * Nombre del cliente
   * - Para COTIZACION: permite clientes anónimos (nombre libre)
   * - Para VENTA: se toma del tercero relacionado
   */
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'cliente_nombre',
  })
  clienteNombre: string | null;

  /**
   * onDelete: 'SET NULL'
   * Si se elimina el tercero, el comprobante queda como venta anónima
   * Permite mantener el historial de ventas incluso si el cliente ya no existe
   */
  @ManyToOne(() => Tercero, (tercero) => tercero.comprobantes, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'tercero_id' })
  tercero: Tercero | null;

  // RELACIÓN CON EMPRESA (Multi-tenancy)
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // RELACIÓN CON USUARIO EMISOR
  /**
   * Usuario que registró la venta en el sistema.
   * - Para VENTA: se registra automáticamente desde el JWT
   * - onDelete: SET NULL (si se elimina el usuario, la venta permanece)
   */
  @Column({ type: 'uuid', nullable: true, name: 'usuario_id' })
  usuarioId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  // RELACIÓN CON COBROS
  /**
   * onDelete: CASCADE implícito en Cobro
   * Si se elimina el comprobante, todos sus cobros se eliminan también
   */
  @OneToMany(() => Cobro, (cobro) => cobro.comprobante, { cascade: true })
  cobros: Cobro[];

  // RELACIÓN CON DETALLES (ITEMS DE VENTA)
  /**
   * onDelete: CASCADE implícito en ComprobanteDetalle
   * Si se elimina el comprobante, todos sus detalles se eliminan también
   * cascade: true permite guardar el comprobante con sus detalles en una sola operación
   */
  @OneToMany(() => ComprobanteDetalle, (detalle) => detalle.comprobante, {
    cascade: true,
  })
  detalles: ComprobanteDetalle[];

  // SOFT DELETE
  @Column({ type: 'boolean', default: false })
  eliminado: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
