import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Tercero } from '../entities/tercero.entity';
import {
  SaldoTerceroResponseDto,
  CrearTerceroDto,
  ActualizarTerceroDto,
  TerceroResponseDto,
  ListarTercerosQueryDto,
} from './dto';

/**
 * SERVICIO: Terceros
 *
 * Gestiona la lógica de negocio para el módulo de terceros (clientes y proveedores).
 *
 * Responsabilidades:
 * - CRUD completo de terceros
 * - Validación de reglas de negocio
 * - Consultas con filtros
 * - Soft delete
 */
@Injectable()
export class TercerosService {
  constructor(
    @InjectRepository(Tercero)
    private readonly terceroRepository: Repository<Tercero>,
  ) {}

  /**
   * MÉTODO: Crear Tercero
   *
   * Registra un nuevo tercero (cliente o proveedor) en el sistema.
   *
   * Validaciones:
   * - El nombre no debe estar vacío
   * - El tipo debe ser CLIENTE o PROVEEDOR
   *
   * El saldoActual se inicializa automáticamente en 0.
   *
   * @param dto Datos del tercero a crear
   * @param empresaId ID de la empresa (tenant)
   * @returns Tercero creado
   */
  async crear(
    dto: CrearTerceroDto,
    empresaId: string,
    usuarioId?: string,
  ): Promise<TerceroResponseDto> {
    // Crear el tercero
    const tercero = this.terceroRepository.create({
      nombre: dto.nombre,
      direccion: dto.direccion || null,
      tipo: dto.tipo,
      empresaId,
      usuarioId: usuarioId || null,
      saldoActual: 0, // Inicializar en 0
      eliminado: false,
      deletedAt: null,
    });

    // Guardar en la base de datos
    const terceroGuardado = await this.terceroRepository.save(tercero);

    // Recargar con relación usuario para incluirla en la respuesta
    const terceroConUsuario = await this.terceroRepository.findOne({
      where: { id: terceroGuardado.id },
      relations: ['usuario'],
    });

    return this.mapearATerceroResponse(terceroConUsuario!);
  }

  /**
   * MÉTODO: Listar Terceros
   *
   * Obtiene un listado de terceros con filtros opcionales.
   *
   * Filtros disponibles:
   * - tipo: Filtra por tipo de tercero (CLIENTE o PROVEEDOR)
   * - busqueda: Búsqueda por nombre (case-insensitive)
   *
   * Ordenamiento:
   * - Por nombre (ASC)
   *
   * @param query Filtros de búsqueda
   * @param empresaId ID de la empresa (tenant)
   * @returns Lista de terceros
   */
  async listar(
    query: ListarTercerosQueryDto,
    empresaId: string,
  ): Promise<TerceroResponseDto[]> {
    const where: FindOptionsWhere<Tercero> = {
      empresaId,
      eliminado: false,
    };

    // Aplicar filtro por tipo si existe
    if (query.tipo) {
      where.tipo = query.tipo;
    }

    // Aplicar filtro de búsqueda por nombre si existe
    if (query.busqueda) {
      where.nombre = Like(`%${query.busqueda}%`) as any;
    }

    // Buscar terceros con filtros aplicados
    const terceros = await this.terceroRepository.find({
      where,
      order: { nombre: 'ASC' },
      relations: ['usuario'],
    });

    return terceros.map((t) => this.mapearATerceroResponse(t));
  }

  /**
   * MÉTODO: Obtener por ID
   *
   * Obtiene el detalle completo de un tercero específico.
   *
   * @param id ID del tercero
   * @param empresaId ID de la empresa (tenant)
   * @returns Detalle del tercero
   */
  async obtenerPorId(
    id: string,
    empresaId: string,
  ): Promise<TerceroResponseDto> {
    const tercero = await this.terceroRepository.findOne({
      where: { id, empresaId, eliminado: false },
      relations: ['usuario'],
    });

    if (!tercero) {
      throw new NotFoundException(`Tercero ${id} no encontrado`);
    }

    return this.mapearATerceroResponse(tercero);
  }

  /**
   * MÉTODO: Actualizar Tercero
   *
   * Actualiza los datos de un tercero existente.
   *
   * Reglas:
   * - Solo se actualizan los campos enviados (PATCH)
   * - No se puede actualizar el saldoActual manualmente
   * - No se puede cambiar de empresa (multi-tenancy)
   *
   * @param id ID del tercero
   * @param dto Datos a actualizar
   * @param empresaId ID de la empresa (tenant)
   * @returns Tercero actualizado
   */
  async actualizar(
    id: string,
    dto: ActualizarTerceroDto,
    empresaId: string,
  ): Promise<TerceroResponseDto> {
    // Verificar que el tercero existe
    const tercero = await this.terceroRepository.findOne({
      where: { id, empresaId, eliminado: false },
    });

    if (!tercero) {
      throw new NotFoundException(`Tercero ${id} no encontrado`);
    }

    // Actualizar solo los campos enviados
    if (dto.nombre !== undefined) {
      tercero.nombre = dto.nombre;
    }

    if (dto.direccion !== undefined) {
      tercero.direccion = dto.direccion || null;
    }

    if (dto.tipo !== undefined) {
      tercero.tipo = dto.tipo;
    }

    // Guardar cambios
    await this.terceroRepository.save(tercero);

    // Recargar con relación usuario
    const terceroActualizado = await this.terceroRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    return this.mapearATerceroResponse(terceroActualizado!);
  }

  /**
   * MÉTODO: Eliminar Tercero (Soft Delete)
   *
   * Marca un tercero como eliminado sin borrarlo físicamente.
   *
   * Validaciones:
   * - No se puede eliminar un tercero con saldo pendiente
   *
   * @param id ID del tercero
   * @param empresaId ID de la empresa (tenant)
   */
  async eliminar(id: string, empresaId: string): Promise<void> {
    // Verificar que el tercero existe
    const tercero = await this.terceroRepository.findOne({
      where: { id, empresaId, eliminado: false },
    });

    if (!tercero) {
      throw new NotFoundException(`Tercero ${id} no encontrado`);
    }

    // Validar que no tenga saldo pendiente
    if (tercero.saldoActual !== 0) {
      throw new ConflictException(
        `No se puede eliminar el tercero. Tiene un saldo pendiente de $${tercero.saldoActual.toFixed(2)}`,
      );
    }

    // Marcar como eliminado (soft delete)
    tercero.eliminado = true;
    tercero.deletedAt = new Date();

    await this.terceroRepository.save(tercero);
  }

  /**
   * MÉTODO: Obtener Saldo
   *
   * Obtiene el saldo actual de un tercero y su estado.
   *
   * @param id ID del tercero
   * @param empresaId ID de la empresa (tenant)
   * @returns Información del saldo del tercero
   */
  async getSaldo(
    id: string,
    empresaId: string,
  ): Promise<SaldoTerceroResponseDto> {
    // Buscar el tercero por ID y empresaId
    const tercero = await this.terceroRepository.findOne({
      where: { id, empresaId, eliminado: false },
    });

    if (!tercero) {
      throw new NotFoundException(`Tercero ${id} no encontrado`);
    }

    // Determinar el estado según el saldo
    const estado = tercero.saldoActual > 0 ? 'DEUDOR' : 'AL_DIA';

    return {
      clienteNombre: tercero.nombre,
      saldoTotal: tercero.saldoActual,
      estado,
    };
  }

  /**
   * Helper: Mapear entidad a DTO de respuesta
   */
  private mapearATerceroResponse(tercero: Tercero): TerceroResponseDto {
    return {
      id: tercero.id,
      nombre: tercero.nombre,
      direccion: tercero.direccion,
      tipo: tercero.tipo,
      saldoActual: tercero.saldoActual,
      createdAt: tercero.createdAt,
      updatedAt: tercero.updatedAt,
      usuario: tercero.usuario
        ? { id: tercero.usuario.id, nombre: tercero.usuario.nombre }
        : null,
    };
  }
}
