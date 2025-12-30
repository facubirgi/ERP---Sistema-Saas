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
import { Producto } from '../../inventario/productos/entities/producto.entity';
import { Comprobante } from './comprobante.entity';

/**
 * ENTIDAD COMPROBANTE DETALLE
 *
 * Representa los items individuales de cada venta/cotización.
 * Cada línea del comprobante es un detalle.
 *
 * Características clave:
 * - UUID como PK
 * - Multi-tenant (empresaId)
 * - NO tiene Soft Delete (los detalles de venta son inmutables)
 * - Denormalización intencional: nombreProducto y subtotal
 *   - nombreProducto: Preserva el nombre del producto al momento de la venta
 *   - subtotal: Se persiste para optimizar consultas y reportes
 * - Relación CASCADE con Comprobante (si se elimina el comprobante, se eliminan sus detalles)
 * - Relación RESTRICT con Producto (no se puede eliminar un producto con ventas)
 * - Precision decimal para cálculos financieros exactos
 */
@Entity('comprobante_detalle')
@Index(['empresaId']) // Filtros por tenant
@Index(['comprobanteId']) // Búsquedas por comprobante
@Index(['productoId']) // Búsquedas por producto
@Index(['empresaId', 'productoId']) // Reportes de productos más vendidos
export class ComprobanteDetalle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RELACIÓN CON COMPROBANTE (OBLIGATORIO)
  @Column({ type: 'uuid', name: 'comprobante_id' })
  comprobanteId: string;

  /**
   * onDelete: 'CASCADE'
   * Si se elimina el comprobante, todos sus detalles se eliminan automáticamente
   * Garantiza integridad referencial
   */
  @ManyToOne(() => Comprobante, (comprobante) => comprobante.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comprobante_id' })
  comprobante: Comprobante;

  // RELACIÓN CON PRODUCTO (OBLIGATORIO)
  @Column({ type: 'uuid', name: 'producto_id' })
  productoId: string;

  /**
   * onDelete: 'RESTRICT'
   * NO permite eliminar un producto que tiene ventas asociadas
   * Mantiene la integridad del historial de ventas
   */
  @ManyToOne(() => Producto, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  /**
   * Nombre del producto (DENORMALIZADO)
   * - Preserva el nombre que tenía el producto al momento de la venta
   * - Si el producto cambia de nombre después, la venta muestra el nombre original
   * - Crítico para mantener historial preciso
   */
  @Column({ type: 'varchar', length: 200, name: 'nombre_producto' })
  nombreProducto: string;

  /**
   * Cantidad vendida
   * - Tipo int: productos enteros (no fraccionarios)
   * - Siempre >= 1
   */
  @Column({ type: 'int' })
  cantidad: number;

  /**
   * Precio unitario al momento de la venta
   * - Precision: 12 dígitos, 2 decimales
   * - Denormalizado: Se preserva el precio exacto de la venta
   * - Si el producto cambia de precio después, la venta mantiene el precio original
   * - Transformer: Convierte string de BD a number en JS
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'precio_unitario',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  precioUnitario: number;

  /**
   * Subtotal (DENORMALIZADO)
   * - Precision: 12 dígitos, 2 decimales
   * - Fórmula: cantidad * precioUnitario
   * - Se calcula antes de guardar pero se persiste por:
   *   1. Optimización: Reportes sin recalcular
   *   2. Auditoría: Verificar cálculos históricos
   *   3. Exactitud: Evitar redondeos en consultas
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
  subtotal: number;

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
