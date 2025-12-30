import {
  Injectable,
  Scope,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantBaseService } from '../../common/services/tenant-base.service';
import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../common/dto/pagination.dto';
import { AppConfig } from '../../common/config/app.config';

/**
 * SERVICIO DE CATEGORÍAS
 *
 * Extiende TenantBaseService para heredar funcionalidad multi-tenant.
 * Scope.REQUEST para acceso automático al empresaId desde el request.
 *
 * Funcionalidades especiales:
 * - Soft delete con validación RESTRICT (no eliminar si tiene productos activos)
 * - Restauración de categorías eliminadas
 * - Paginación en listados
 * - Filtrado automático de categorías eliminadas
 */
@Injectable({ scope: Scope.REQUEST })
export class CategoriasService extends TenantBaseService<Categoria> {
  constructor(
    @InjectRepository(Categoria)
    repository: Repository<Categoria>,
    @Inject(REQUEST) request: Request,
  ) {
    super(repository, request);
  }

  /**
   * CREAR CATEGORÍA
   */
  async create(createDto: CreateCategoriaDto): Promise<Categoria> {
    // Validar que no exista una categoría con el mismo nombre (incluyendo eliminadas)
    const existe = await this.repository.findOne({
      where: {
        nombre: createDto.nombre,
        empresaId: this.empresaId,
      },
    });

    if (existe && !existe.eliminado) {
      throw new BadRequestException(
        `Ya existe una categoría con el nombre "${createDto.nombre}"`,
      );
    }

    if (existe && existe.eliminado) {
      throw new BadRequestException(
        `Existe una categoría eliminada con ese nombre. Puede restaurarla usando el ID: ${existe.id}`,
      );
    }

    return super.create(createDto);
  }

  /**
   * LISTAR TODAS (solo activas, no eliminadas)
   * Override del método base para filtrar eliminados
   */
  async findAll(): Promise<Categoria[]> {
    return this.repository.find({
      where: {
        empresaId: this.empresaId,
        eliminado: false,
      },
      order: {
        nombre: 'ASC',
      },
    });
  }

  /**
   * LISTAR CON PAGINACIÓN (solo activas)
   */
  async findAllPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Categoria>> {
    const page = paginationDto.page || AppConfig.pagination.defaultPage;
    const limit = Math.min(
      paginationDto.limit || AppConfig.pagination.defaultLimit,
      AppConfig.pagination.maxLimit,
    );
    const skip = (page - 1) * limit;

    const [categorias, total] = await this.repository.findAndCount({
      where: {
        empresaId: this.empresaId,
        eliminado: false,
      },
      order: {
        nombre: 'ASC',
      },
      skip,
      take: limit,
    });

    return new PaginatedResponseDto(categorias, total, page, limit);
  }

  /**
   * BUSCAR POR ID (solo activas)
   * Override para excluir eliminadas por defecto
   */
  async findOne(id: string): Promise<Categoria> {
    const categoria = await this.repository.findOne({
      where: {
        id,
        empresaId: this.empresaId,
        eliminado: false,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return categoria;
  }

  /**
   * ACTUALIZAR CATEGORÍA
   */
  async update(id: string, updateDto: UpdateCategoriaDto): Promise<Categoria> {
    const categoria = await this.findOne(id);

    // Si se cambia el nombre, validar unicidad
    if (updateDto.nombre && updateDto.nombre !== categoria.nombre) {
      const existe = await this.repository.findOne({
        where: {
          nombre: updateDto.nombre,
          empresaId: this.empresaId,
          eliminado: false,
        },
      });

      if (existe) {
        throw new BadRequestException(
          `Ya existe una categoría con el nombre "${updateDto.nombre}"`,
        );
      }
    }

    Object.assign(categoria, updateDto);
    return this.repository.save(categoria);
  }

  /**
   * SOFT DELETE CON VALIDACIÓN RESTRICT
   *
   * NO permite eliminar categorías que tengan productos activos asociados.
   * Regla de negocio crítica para mantener integridad referencial.
   */
  async softDelete(id: string): Promise<void> {
    const categoria = await this.repository.findOne({
      where: {
        id,
        empresaId: this.empresaId,
      },
      relations: ['productos'],
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (categoria.eliminado) {
      throw new BadRequestException('La categoría ya está eliminada');
    }

    // VALIDACIÓN RESTRICT: Verificar productos activos asociados
    const productosActivos =
      categoria.productos?.filter((p) => !p.eliminado) || [];

    if (productosActivos.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar la categoría porque tiene ${productosActivos.length} producto(s) asociado(s). ` +
          `Debe eliminar o reasignar los productos primero.`,
      );
    }

    // Marcar como eliminada
    categoria.eliminado = true;
    categoria.deletedAt = new Date();
    await this.repository.save(categoria);
  }

  /**
   * RESTAURAR CATEGORÍA ELIMINADA
   */
  async restore(id: string): Promise<Categoria> {
    const categoria = await this.repository.findOne({
      where: {
        id,
        empresaId: this.empresaId,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (!categoria.eliminado) {
      throw new BadRequestException('La categoría no está eliminada');
    }

    // Validar que no exista otra activa con el mismo nombre
    const existe = await this.repository.findOne({
      where: {
        nombre: categoria.nombre,
        empresaId: this.empresaId,
        eliminado: false,
      },
    });

    if (existe) {
      throw new BadRequestException(
        `No se puede restaurar. Ya existe una categoría activa con el nombre "${categoria.nombre}"`,
      );
    }

    categoria.eliminado = false;
    categoria.deletedAt = null;
    return this.repository.save(categoria);
  }

  /**
   * LISTAR CATEGORÍAS ELIMINADAS (para gestión)
   */
  async findDeleted(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Categoria>> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [categorias, total] = await this.repository.findAndCount({
      where: {
        empresaId: this.empresaId,
        eliminado: true,
      },
      order: {
        deletedAt: 'DESC',
      },
      skip,
      take: limit,
    });

    return new PaginatedResponseDto(categorias, total, page, limit);
  }

  /**
   * CONTAR PRODUCTOS POR CATEGORÍA (para estadísticas)
   */
  async countProductos(id: string): Promise<number> {
    const categoria = await this.repository.findOne({
      where: {
        id,
        empresaId: this.empresaId,
        eliminado: false,
      },
      relations: ['productos'],
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return categoria.productos?.filter((p) => !p.eliminado).length || 0;
  }
}
