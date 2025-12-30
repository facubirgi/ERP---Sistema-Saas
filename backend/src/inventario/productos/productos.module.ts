import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';
import { Producto } from './entities/producto.entity';
import { Categoria } from '../categorias/entities/categoria.entity';

/**
 * MÓDULO DE PRODUCTOS
 *
 * Gestiona los productos del sistema de inventario.
 *
 * Funcionalidades:
 * - CRUD completo con soft delete
 * - Margen Inteligente (actualización automática de precio de venta)
 * - Búsqueda Híbrida (código exacto + nombre parcial)
 * - Alertas de stock bajo
 * - Validación de margen mínimo
 * - Código de barras único por tenant
 * - Multi-tenant automático
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      Categoria, // Importar Categoria para validación en ProductosService
    ]),
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService], // Exportar para uso en módulos de ventas/caja
})
export class ProductosModule {}
