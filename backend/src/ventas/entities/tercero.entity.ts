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
import { TipoTercero } from '../enums';
import { Comprobante } from './comprobante.entity';

/**
 * ENTIDAD TERCERO
 *
 * Representa un tercero (cliente o proveedor) en el sistema de ventas.
 *
 * Características clave:
 * - UUID como PK
 * - Multi-tenant (empresaId)
 * - Soft Delete (eliminado, deletedAt)
 * - Tipo: CLIENTE o PROVEEDOR (puede tener ambos roles)
 * - Cache de saldo actual para optimizar consultas de cuentas corrientes
 * - Relación con comprobantes de venta
 */
@Entity('tercero')
@Index(['empresaId']) // Filtros por tenant
@Index(['empresaId', 'eliminado']) // Búsquedas de activos
@Index(['empresaId', 'tipo']) // Filtros por tipo de tercero
export class Tercero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  /**
   * Dirección del tercero
   * Campo opcional para almacenar la dirección física o de entrega
   */
  @Column({ type: 'varchar', length: 300, nullable: true })
  direccion: string | null;

  /**
   * Tipo de tercero: CLIENTE o PROVEEDOR
   * Permite clasificar y filtrar terceros por su rol
   */
  @Column({
    type: 'enum',
    enum: TipoTercero,
  })
  tipo: TipoTercero;

  /**
   * Saldo actual de cuenta corriente
   * - Cache del saldo pendiente de pago
   * - Precision: 12 dígitos, 2 decimales
   * - Se actualiza automáticamente al registrar ventas y cobros
   * - Positivo: el tercero nos debe
   * - Negativo: nosotros le debemos al tercero
   * - Transformer: Convierte string de BD a number en JS
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'saldo_actual',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  saldoActual: number;

  // RELACIÓN CON EMPRESA (Multi-tenancy)
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // RELACIÓN CON USUARIO QUE LO CREÓ
  @Column({ type: 'uuid', nullable: true, name: 'usuario_id' })
  usuarioId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  // RELACIÓN CON COMPROBANTES
  @OneToMany(() => Comprobante, (comprobante) => comprobante.tercero)
  comprobantes: Comprobante[];

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
