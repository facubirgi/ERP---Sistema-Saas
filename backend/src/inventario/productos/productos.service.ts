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
import { Producto } from './entities/producto.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { SearchProductoDto } from './dto/search-producto.dto';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../common/dto/pagination.dto';
import { AppConfig } from '../../common/config/app.config';

/**
 * SERVICIO DE PRODUCTOS
 *
 * Extiende TenantBaseService para heredar funcionalidad multi-tenant.
 * Scope.REQUEST para acceso automático al empresaId desde el request.
 *
 * Funcionalidades especiales:
 * - ⚡ MARGEN INTELIGENTE: Mantiene margen al actualizar precio de costo
 * - 🔍 BÚSQUEDA HÍBRIDA: Código exacto + nombre parcial con paginación
 * - ✅ VALIDACIÓN DE MARGEN: No permite márgenes negativos
 * - 🗑️ SOFT DELETE: Eliminación lógica
 * - 🔒 VALIDACIÓN DE CATEGORÍA: Solo categorías del mismo tenant
 */
@Injectable({ scope: Scope.REQUEST })
export class ProductosService extends TenantBaseService<Producto> {
  constructor(
    @InjectRepository(Producto)
    repository: Repository<Producto>,
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,
    @Inject(REQUEST) request: Request,
  ) {
    super(repository, request);
  }

  /**
   * CREAR PRODUCTO
   * Valida categoría y margen mínimo
   */
  async create(createDto: CreateProductoDto): Promise<Producto> {
    // Validar categoría existe y pertenece al tenant
    await this.validateCategoriaExists(createDto.categoriaId);

    // Validar margen mínimo
    this.validateMargen(createDto.precioCosto, createDto.precioVenta);

    // Validar código de barras único si se proporciona
    if (createDto.codigoBarras) {
      await this.validateCodigoBarrasUnico(createDto.codigoBarras);
    }

    return super.create(createDto);
  }

  /**
   * LISTAR TODOS (solo activos, no eliminados)
   */
  async findAll(): Promise<Producto[]> {
    return this.repository.find({
      where: {
        empresaId: this.empresaId,
        eliminado: false,
      },
      relations: ['categoria'],
      order: {
        nombre: 'ASC',
      },
    });
  }

  /**
   * LISTAR CON PAGINACIÓN (solo activos)
   */
  async findAllPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Producto>> {
    const page = paginationDto.page || AppConfig.pagination.defaultPage;
    const limit = Math.min(
      paginationDto.limit || AppConfig.pagination.defaultLimit,
      AppConfig.pagination.maxLimit,
    );
    const skip = (page - 1) * limit;

    const [productos, total] = await this.repository.findAndCount({
      where: {
        empresaId: this.empresaId,
        eliminado: false,
      },
      relations: ['categoria'],
      order: {
        nombre: 'ASC',
      },
      skip,
      take: limit,
    });

    return new PaginatedResponseDto(productos, total, page, limit);
  }

  /**
   * BUSCAR POR ID (solo activos)
   */
  async findOne(id: string): Promise<Producto> {
    const producto = await this.repository.findOne({
      where: {
        id,
        empresaId: this.empresaId,
        eliminado: false,
      },
      relations: ['categoria'],
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return producto;
  }

  /**
   * ⚡ ACTUALIZAR PRODUCTO CON MARGEN INTELIGENTE
   *
   * FUNCIONALIDAD ESPECIAL:
   * Si se actualiza precioCosto pero NO se envía precioVenta:
   * 1. Calcula el margen actual (%)
   * 2. Aplica el mismo margen al nuevo precio de costo
   * 3. Actualiza precioVenta automáticamente
   *
   * Ejemplo:
   * - Precio costo actual: $100
   * - Precio venta actual: $150
   * - Margen actual: 50%
   * - Si se actualiza precio costo a $120
   * - Nuevo precio venta automático: $180 (mantiene 50%)
   */
  async update(id: string, updateDto: UpdateProductoDto): Promise<Producto> {
    const producto = await this.findOne(id);

    // Validar categoría si se actualiza
    if (updateDto.categoriaId) {
      await this.validateCategoriaExists(updateDto.categoriaId);
    }

    // Validar código de barras único si se actualiza
    if (
      updateDto.codigoBarras &&
      updateDto.codigoBarras !== producto.codigoBarras
    ) {
      await this.validateCodigoBarrasUnico(updateDto.codigoBarras, id);
    }

    // ⚡ MARGEN INTELIGENTE
    if (
      updateDto.precioCosto !== undefined &&
      updateDto.precioVenta === undefined
    ) {
      // Calcular margen actual (porcentaje)
      const margenActual =
        (producto.precioVenta - producto.precioCosto) / producto.precioCosto;

      // Validar que el margen actual no sea negativo
      if (margenActual < 0) {
        throw new BadRequestException(
          `El producto tiene un margen negativo (${(margenActual * 100).toFixed(2)}%). ` +
            `Debe especificar manualmente el nuevo precio de venta.`,
        );
      }

      // Aplicar el mismo margen al nuevo precio de costo
      updateDto.precioVenta = updateDto.precioCosto * (1 + margenActual);

      // Redondear a 2 decimales
      updateDto.precioVenta = Math.round(updateDto.precioVenta * 100) / 100;
    }

    // Validar margen mínimo si se actualizan los precios
    const nuevoPrecioCosto = updateDto.precioCosto ?? producto.precioCosto;
    const nuevoPrecioVenta = updateDto.precioVenta ?? producto.precioVenta;
    this.validateMargen(nuevoPrecioCosto, nuevoPrecioVenta);

    Object.assign(producto, updateDto);
    return this.repository.save(producto);
  }

  /**
   * 🔍 BÚSQUEDA HÍBRIDA PARA POS
   *
   * Estrategia de búsqueda optimizada para sistemas POS:
   * 1. PRIORIDAD: Búsqueda EXACTA por código de barras (escáner)
   *    - Si encuentra, retorna inmediatamente
   *    - Sin paginación (solo 1 resultado)
   * 2. FALLBACK: Búsqueda PARCIAL por nombre (usuario tecleando)
   *    - ILIKE para coincidencias parciales
   *    - CON paginación
   *    - Ordenado alfabéticamente
   *
   * Casos de uso:
   * - Escáner envía "7790001234567" → match exacto inmediato
   * - Usuario teclea "coca" → lista paginada de "Coca Cola", "Coca Zero", etc.
   */
  async search(
    searchDto: SearchProductoDto,
  ): Promise<PaginatedResponseDto<Producto>> {
    const { termino } = searchDto;
    const page = searchDto.page || AppConfig.pagination.defaultPage;
    const limit = Math.min(
      searchDto.limit || AppConfig.pagination.defaultLimit,
      AppConfig.pagination.maxLimit,
    );

    // ESTRATEGIA 1: Búsqueda EXACTA por código de barras
    const porCodigo = await this.repository.findOne({
      where: {
        empresaId: this.empresaId,
        codigoBarras: termino,
        eliminado: false,
      },
      relations: ['categoria'],
    });

    // Si encuentra por código, retornar inmediatamente
    if (porCodigo) {
      return new PaginatedResponseDto([porCodigo], 1, 1, 1);
    }

    // ESTRATEGIA 2: Búsqueda PARCIAL por nombre con paginación
    const skip = (page - 1) * limit;

    const [productos, total] = await this.repository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .where('producto.empresaId = :empresaId', {
        empresaId: this.empresaId,
      })
      .andWhere('producto.eliminado = false')
      .andWhere('producto.nombre ILIKE :termino', {
        termino: `%${termino}%`,
      })
      .orderBy('producto.nombre', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResponseDto(productos, total, page, limit);
  }

  /**
   * HARD DELETE - Eliminación física permanente
   * Elimina completamente el producto de la base de datos
   */
  async hardDelete(id: string): Promise<void> {
    const producto = await this.repository.findOne({
      where: {
        id,
        empresaId: this.empresaId,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Eliminación física permanente
    await this.repository.remove(producto);
  }

  /**
   * RESTAURAR PRODUCTO ELIMINADO
   * NOTA: Este método ya no es funcional con hard delete
   * Se mantiene por compatibilidad pero siempre lanzará error 404
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  restore(id: string): never {
    throw new NotFoundException(
      'No se puede restaurar un producto eliminado. Los productos se eliminan permanentemente.',
    );
  }

  /**
   * LISTAR PRODUCTOS CON STOCK BAJO
   * (stock actual <= stock mínimo * multiplicador)
   */
  async findBajoStock(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Producto>> {
    const page = paginationDto.page || AppConfig.pagination.defaultPage;
    const limit = Math.min(
      paginationDto.limit || AppConfig.pagination.defaultLimit,
      AppConfig.pagination.maxLimit,
    );
    const skip = (page - 1) * limit;
    const multiplicador = AppConfig.inventario.stockBajoMultiplicador;

    const [productos, total] = await this.repository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .where('producto.empresaId = :empresaId', {
        empresaId: this.empresaId,
      })
      .andWhere('producto.eliminado = false')
      .andWhere(
        'producto.stockActual <= producto.stockMinimo * :multiplicador',
        { multiplicador },
      )
      .orderBy('producto.stockActual', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResponseDto(productos, total, page, limit);
  }

  /**
   * VALIDAR QUE LA CATEGORÍA EXISTE Y PERTENECE AL TENANT
   */
  private async validateCategoriaExists(categoriaId: string): Promise<void> {
    const categoria = await this.categoriaRepository.findOne({
      where: {
        id: categoriaId,
        empresaId: this.empresaId,
        eliminado: false,
      },
    });

    if (!categoria) {
      throw new BadRequestException(
        'Categoría no encontrada o no pertenece a su empresa',
      );
    }
  }

  /**
   * VALIDAR MARGEN MÍNIMO
   * No permite márgenes menores al configurado (por defecto 0%)
   */
  private validateMargen(precioCosto: number, precioVenta: number): void {
    const margen = (precioVenta - precioCosto) / precioCosto;
    const margenPorcentaje = margen * 100;
    const margenMinimo = AppConfig.inventario.margenMinimoPorcentaje;

    if (margenPorcentaje < margenMinimo) {
      throw new BadRequestException(
        `El margen de ganancia (${margenPorcentaje.toFixed(2)}%) es menor al mínimo permitido (${margenMinimo}%). ` +
          `El precio de venta debe ser al menos ${(precioCosto * (1 + margenMinimo / 100)).toFixed(2)}.`,
      );
    }
  }

  /**
   * VALIDAR CÓDIGO DE BARRAS ÚNICO DENTRO DEL TENANT
   */
  private async validateCodigoBarrasUnico(
    codigoBarras: string,
    excludeId?: string,
  ): Promise<void> {
    const existe = await this.repository.findOne({
      where: {
        empresaId: this.empresaId,
        codigoBarras,
        eliminado: false,
      },
    });

    if (existe && existe.id !== excludeId) {
      throw new BadRequestException(
        `Ya existe un producto con el código de barras "${codigoBarras}" en su empresa`,
      );
    }
  }
}
