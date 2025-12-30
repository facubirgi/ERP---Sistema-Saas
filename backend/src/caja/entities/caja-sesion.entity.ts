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
import { EstadoCaja } from '../enums';
import { MovimientoCaja } from './movimiento-caja.entity';

/**
 * ENTIDAD CAJA SESION
 *
 * Representa una sesión de caja (apertura y cierre) en el sistema de tesorería.
 *
 * Características clave:
 * - UUID como PK
 * - Multi-tenant (empresaId)
 * - Control de estado (ABIERTA, CERRADA)
 * - Tracking de montos: inicial, final sistema, final real, diferencia
 * - Relación con Usuario (quien abre/cierra la caja)
 * - Relación OneToMany con MovimientoCaja
 * - Solo puede haber UNA sesión ABIERTA por empresa al mismo tiempo
 */
@Entity('caja_sesion')
@Index(['empresaId']) // Filtros por tenant
@Index(['empresaId', 'estado']) // Filtro común: buscar sesión abierta
@Index(['empresaId', 'fechaApertura']) // Para reportes
export class CajaSesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Fecha y hora de apertura de caja
   * - Se registra automáticamente al abrir la sesión
   */
  @Column({ type: 'timestamp', name: 'fecha_apertura' })
  fechaApertura: Date;

  /**
   * Fecha y hora de cierre de caja
   * - Nullable: NULL mientras la caja está ABIERTA
   * - Se registra al cerrar la sesión
   */
  @Column({ type: 'timestamp', nullable: true, name: 'fecha_cierre' })
  fechaCierre: Date | null;

  /**
   * Monto inicial con el que se abre la caja
   * - Precision: 12 dígitos, 2 decimales
   * - Es el saldo de arranque del día
   * - Transformer: Convierte string de BD a number en JS
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'monto_inicial',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  montoInicial: number;

  /**
   * Monto final calculado por el sistema
   * - Precision: 12 dígitos, 2 decimales
   * - Fórmula: Inicial + Σ(Ingresos EFECTIVO) - Σ(Egresos EFECTIVO)
   * - SOLO cuenta movimientos en EFECTIVO para el arqueo físico
   * - Se actualiza automáticamente con cada movimiento
   * - Transformer: Convierte string de BD a number en JS
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'monto_final_sistema',
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : null),
    },
  })
  montoFinalSistema: number | null;

  /**
   * Monto final real (declarado por el usuario al cierre)
   * - Precision: 12 dígitos, 2 decimales
   * - Es el efectivo físico contado al cerrar la caja
   * - Se ingresa manualmente al momento del cierre
   * - Transformer: Convierte string de BD a number en JS
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'monto_final_real',
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : null),
    },
  })
  montoFinalReal: number | null;

  /**
   * Diferencia entre monto real y sistema
   * - Precision: 12 dígitos, 2 decimales
   * - Fórmula: montoFinalReal - montoFinalSistema
   * - Positivo: Sobrante de caja
   * - Negativo: Faltante de caja
   * - Se calcula al momento del cierre
   * - Transformer: Convierte string de BD a number en JS
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : null),
    },
  })
  diferencia: number | null;

  /**
   * Estado de la sesión de caja
   * - ABIERTA: Sesión activa, se pueden registrar movimientos
   * - CERRADA: Sesión finalizada, no se permiten más movimientos
   */
  @Column({
    type: 'enum',
    enum: EstadoCaja,
    default: EstadoCaja.ABIERTA,
  })
  estado: EstadoCaja;

  // RELACIÓN CON USUARIO (quien abre/cierra la caja)
  @Column({ type: 'uuid', name: 'usuario_id' })
  usuarioId: string;

  /**
   * onDelete: 'SET NULL'
   * Si se elimina el usuario, la sesión queda sin usuario asignado
   * Permite mantener el historial incluso si el usuario ya no existe
   */
  @ManyToOne(() => Usuario, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  // RELACIÓN CON EMPRESA (Multi-tenancy)
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // RELACIÓN CON MOVIMIENTOS DE CAJA
  /**
   * onDelete: CASCADE implícito en MovimientoCaja
   * Si se elimina la sesión, todos sus movimientos se eliminan también
   */
  @OneToMany(() => MovimientoCaja, (movimiento) => movimiento.sesion, {
    cascade: true,
  })
  movimientos: MovimientoCaja[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
