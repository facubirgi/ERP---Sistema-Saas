import { Inject, Injectable, Scope, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import type { Request } from 'express';

/**
 * TENANT BASE SERVICE (Abstract)
 *
 * Servicio base abstracto para todos los servicios multi-tenant.
 * Proporciona funcionalidad común con aislamiento automático por empresa.
 *
 * Características:
 * - Scope.REQUEST: Nueva instancia por cada request HTTP
 * - Auto-inyección de empresaId desde el JWT (vía TenantGuard)
 * - Métodos CRUD base con filtrado automático por tenant
 * - Type-safe: Genérico T debe extender { empresaId: string }
 *
 * Uso:
 * @Injectable({ scope: Scope.REQUEST })
 * export class ProductosService extends TenantBaseService<Producto> {
 *   constructor(
 *     @InjectRepository(Producto) repository: Repository<Producto>,
 *     @Inject(REQUEST) request: Request,
 *   ) {
 *     super(repository, request);
 *   }
 * }
 */
@Injectable({ scope: Scope.REQUEST })
export abstract class TenantBaseService<T extends { empresaId: string }> {
  constructor(
    protected repository: Repository<T>,
    @Inject(REQUEST) protected request: Request,
  ) {}

  /**
   * Obtiene el empresaId del request actual.
   * Este valor es inyectado por el TenantGuard desde el JWT.
   *
   * @returns UUID de la empresa del usuario autenticado
   * @throws Error si tenantId no existe en el request
   */
  protected get empresaId(): string {
    const tenantId = this.request['tenantId'];

    if (!tenantId) {
      throw new Error(
        'CRITICAL ERROR: tenantId no encontrado en request. ' +
          'Asegúrate de usar @UseGuards(JwtAuthGuard, TenantGuard) en el controller.',
      );
    }

    return tenantId;
  }

  /**
   * Construye un objeto WHERE con filtro de tenant automático.
   * Combina los filtros personalizados con empresaId.
   *
   * @param where - Condiciones WHERE adicionales
   * @returns Objeto WHERE con empresaId incluido
   */
  protected buildTenantWhere(
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    if (Array.isArray(where)) {
      return where.map(
        (w) => ({ ...w, empresaId: this.empresaId }) as FindOptionsWhere<T>,
      );
    }

    return { ...where, empresaId: this.empresaId } as FindOptionsWhere<T>;
  }

  /**
   * Busca todas las entidades del tenant actual.
   *
   * @param options - Opciones adicionales de búsqueda (relations, order, etc.)
   * @returns Array de entidades
   */
  async findAll(options?: Omit<FindManyOptions<T>, 'where'>): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: this.buildTenantWhere(),
    });
  }

  /**
   * Busca una entidad por ID con verificación de tenant.
   *
   * @param id - UUID de la entidad
   * @param options - Opciones adicionales (relations, etc.)
   * @returns Entidad encontrada
   * @throws NotFoundException si no existe o no pertenece al tenant
   */
  async findOne(
    id: string,
    options?: Omit<FindManyOptions<T>, 'where'>,
  ): Promise<T> {
    const entity = await this.repository.findOne({
      ...options,
      where: this.buildTenantWhere({ id } as any),
    } as any);

    if (!entity) {
      throw new NotFoundException('Recurso no encontrado');
    }

    return entity;
  }

  /**
   * Crea una nueva entidad con empresaId automático.
   *
   * @param createDto - DTO con datos de la entidad
   * @returns Entidad creada
   */
  async create(createDto: Partial<T>): Promise<T> {
    const entity = this.repository.create({
      ...createDto,
      empresaId: this.empresaId,
    } as any);

    const savedResult = await this.repository.save(entity);

    // Manejo seguro: si es array, toma el primer elemento
    return Array.isArray(savedResult) ? savedResult[0] : savedResult;
  }

  /**
   * Actualiza una entidad existente con verificación de tenant.
   *
   * @param id - UUID de la entidad
   * @param updateDto - DTO con datos a actualizar
   * @returns Entidad actualizada
   * @throws NotFoundException si no existe o no pertenece al tenant
   */
  async update(id: string, updateDto: Partial<T>): Promise<T> {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return this.repository.save(entity);
  }

  /**
   * Elimina una entidad con verificación de tenant.
   *
   * @param id - UUID de la entidad
   * @throws NotFoundException si no existe o no pertenece al tenant
   */
  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
  }

  /**
   * Cuenta entidades del tenant actual.
   *
   * @param where - Condiciones WHERE adicionales
   * @returns Número de entidades
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({
      where: this.buildTenantWhere(where),
    });
  }

  /**
   * Verifica si existe una entidad con las condiciones dadas.
   *
   * @param where - Condiciones WHERE
   * @returns true si existe, false si no
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({
      where: this.buildTenantWhere(where),
    });
    return count > 0;
  }
}
