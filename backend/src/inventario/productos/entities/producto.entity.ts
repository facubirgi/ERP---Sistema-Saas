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
import { Empresa } from '../../../tenant/entities/empresa.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';

/**
 * ENTIDAD PRODUCTO
 *
 * Representa un producto en el sistema de inventario.
 *
 * Características clave:
 * - UUID como PK
 * - Multi-tenant (empresaId)
 * - Soft Delete (eliminado, deletedAt)
 * - Código de barras único POR TENANT (índice compuesto parcial)
 * - Precios con precisión decimal
 * - Control de stock (actual vs mínimo)
 * - Relación RESTRICT con Categoría (no se puede eliminar categoría con productos)
 */
@Entity('producto')
// ÍNDICE ÚNICO COMPUESTO: empresaId + codigoBarras
// Parcial: Solo para códigos NO nulos (permite múltiples nulls)
@Index(['empresaId', 'codigoBarras'], {
  unique: true,
  where: 'codigo_barras IS NOT NULL',
})
@Index(['empresaId']) // Filtros por tenant
@Index(['empresaId', 'categoriaId']) // Filtros por categoría
@Index(['empresaId', 'nombre']) // Búsquedas por nombre
@Index(['empresaId', 'stockActual']) // Reportes de stock bajo
@Index(['empresaId', 'eliminado']) // Búsquedas de activos
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'codigo_barras',
  })
  codigoBarras: string | null;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  /**
   * Precio de costo
   * - Precision: 10 dígitos, 2 decimales
   * - Transformer: Convierte string de BD a number en JS
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'precio_costo',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  precioCosto: number;

  /**
   * Precio de venta
   * - Precision: 10 dígitos, 2 decimales
   * - Transformer: Convierte string de BD a number en JS
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'precio_venta',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  precioVenta: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'stock_actual',
  })
  stockActual: number;

  @Column({
    type: 'int',
    default: 5,
    name: 'stock_minimo',
  })
  stockMinimo: number;

  // RELACIÓN CON CATEGORÍA
  @Column({ type: 'uuid', name: 'categoria_id' })
  categoriaId: string;

  /**
   * onDelete: 'RESTRICT'
   * NO permite eliminar una categoría que tiene productos asociados.
   * El servicio validará esto manualmente antes de eliminar.
   */
  @ManyToOne(() => Categoria, (categoria) => categoria.productos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  // RELACIÓN CON EMPRESA (Multi-tenancy)
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

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
