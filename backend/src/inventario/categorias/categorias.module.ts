import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';
import { Categoria } from './entities/categoria.entity';

/**
 * MÓDULO DE CATEGORÍAS
 *
 * Gestiona las categorías de productos del sistema de inventario.
 *
 * Funcionalidades:
 * - CRUD completo con soft delete
 * - Validación RESTRICT (no eliminar si tiene productos)
 * - Restauración de eliminadas
 * - Paginación
 * - Multi-tenant automático
 */
@Module({
  imports: [TypeOrmModule.forFeature([Categoria])],
  controllers: [CategoriasController],
  providers: [CategoriasService],
  exports: [CategoriasService], // Exportar para uso en otros módulos
})
export class CategoriasModule {}
