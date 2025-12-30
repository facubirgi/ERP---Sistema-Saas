import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Empresa } from '../../../tenant/entities/empresa.entity';
import { Producto } from '../../productos/entities/producto.entity';

/**
 * ENTIDAD CATEGORIA
 *
 * Representa una categoría de productos en el sistema de inventario.
 *
 * Características:
 * - UUID como PK
 * - Multi-tenant (empresaId)
 * - Soft Delete (eliminado, deletedAt)
 * - Relación con Productos (para validación Restrict)
 */
@Entity('categoria')
@Index(['empresaId']) // Filtros por tenant
@Index(['empresaId', 'eliminado']) // Búsquedas de activas
export class Categoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // SOFT DELETE: No eliminar físicamente, marcar como eliminado
  @Column({ type: 'boolean', default: false })
  eliminado: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  // Relación INVERSA con Productos
  // Necesaria para validar la regla RESTRICT (no eliminar si tiene productos)
  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos: Producto[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
