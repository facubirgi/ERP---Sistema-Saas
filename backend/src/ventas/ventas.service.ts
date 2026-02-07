import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Scope,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  FindOptionsWhere,
} from 'typeorm';
import { Tercero } from './entities/tercero.entity';
import { Comprobante } from './entities/comprobante.entity';
import { ComprobanteDetalle } from './entities/comprobante-detalle.entity';
import { Cobro } from './entities/cobro.entity';
import { Producto } from '../inventario/productos/entities/producto.entity';
import { TipoTercero, TipoComprobante, EstadoPago } from './enums';
import {
  CrearVentaDto,
  ActualizarComprobanteDto,
  RegistrarCobroDto,
  ActualizarCobroDto,
  VentaResponseDto,
  CobroResponseDto,
  DetalleVentaResponseDto,
  DeudaClienteDto,
  ListarVentasQueryDto,
  VentaListItemDto,
  ExportarCobrosResponseDto,
  CobroExportDto,
  ResumenCobrosDto,
  ResumenPorMetodoDto,
  SesionInfoDto,
  AnularVentaDto,
  AnularVentaResponseDto,
} from './dto';
import { CajaService } from '../caja/caja.service';
import { TipoMovimiento, OrigenMovimiento } from '../caja/enums';
import { mapearMetodoPagoACaja } from './utils/mapeo-caja.util';

/**
 * SERVICIO: Ventas
 *
 * Gestiona la lógica de negocio del módulo de ventas y cobros.
 *
 * Responsabilidades:
 * - Crear ventas con validación de identidad del cliente
 * - Gestionar cobros iniciales y diferidos
 * - Mantener sincronizados los saldos de comprobantes y terceros
 * - Garantizar integridad transaccional
 * - Registrar automáticamente movimientos de caja por cada cobro
 */
@Injectable({ scope: Scope.REQUEST })
export class VentasService {
  private readonly logger = new Logger(VentasService.name);

  constructor(
    @InjectRepository(Tercero)
    private readonly terceroRepository: Repository<Tercero>,
    @InjectRepository(Comprobante)
    private readonly comprobanteRepository: Repository<Comprobante>,
    @InjectRepository(ComprobanteDetalle)
    private readonly comprobanteDetalleRepository: Repository<ComprobanteDetalle>,
    @InjectRepository(Cobro)
    private readonly cobroRepository: Repository<Cobro>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    private readonly dataSource: DataSource,
    private readonly cajaService: CajaService,
  ) {}

  /**
   * MÉTODO: Crear Venta
   *
   * Registra una nueva venta con las siguientes reglas de negocio:
   *
   * 1. Validación de Identidad:
   *    - Si no hay clienteId: venta anónima, debe pagarse completa (montoPagado = total)
   *    - Si hay clienteId: validar que existe y es tipo CLIENTE
   *
   * 2. Creación del Comprobante:
   *    - Calcular total sumando items
   *    - Calcular saldo pendiente (total - montoPagado)
   *    - Determinar estado de pago según saldo
   *
   * 3. Validación y Descuento de Stock:
   *    - Validar que hay stock suficiente de cada producto
   *    - Descontar la cantidad vendida del stock actual
   *    - Usar lock pesimista para evitar condiciones de carrera
   *
   * 4. Registro del Cobro Inicial:
   *    - Si montoPagado > 0: crear cobro con metodoPago
   *    - Si montoPagado = 0: no crear cobro
   *
   * 5. Actualización del Saldo del Cliente:
   *    - Si hay clienteId y saldoPendiente > 0: incrementar saldoActual del tercero
   *
   * @param dto Datos de la venta
   * @param empresaId ID de la empresa (tenant)
   * @returns Respuesta con comprobante, cobro y mensaje
   */
  async crearVenta(
    dto: CrearVentaDto,
    empresaId: string,
  ): Promise<VentaResponseDto> {
    // A. Calcular total de la venta
    const total = dto.items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario,
      0,
    );

    // Redondear a 2 decimales para evitar problemas de precisión
    const totalRedondeado = Math.round(total * 100) / 100;

    // Validación de identidad (ventas anónimas deben pagarse completas)
    if (!dto.clienteId) {
      if (dto.montoPagado < totalRedondeado) {
        throw new BadRequestException(
          'No se permite deuda en ventas anónimas. El monto pagado debe ser igual al total.',
        );
      }
    }

    // Iniciar transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const terceroRepo = queryRunner.manager.getRepository(Tercero);
      const comprobanteRepo = queryRunner.manager.getRepository(Comprobante);
      const cobroRepo = queryRunner.manager.getRepository(Cobro);

      // B. Si hay clienteId, validar que existe y es tipo CLIENTE
      if (dto.clienteId) {
        const cliente = await terceroRepo.findOne({
          where: {
            id: dto.clienteId,
            empresaId,
            tipo: TipoTercero.CLIENTE,
            eliminado: false,
          },
        });

        if (!cliente) {
          throw new NotFoundException('Cliente no encontrado');
        }
      }

      // C. Crear el Comprobante
      const saldoPendiente = totalRedondeado - dto.montoPagado;
      const saldoPendienteRedondeado = Math.round(saldoPendiente * 100) / 100;

      let estadoPago: EstadoPago;
      if (saldoPendienteRedondeado === 0) {
        estadoPago = EstadoPago.PAGADO;
      } else if (dto.montoPagado > 0) {
        estadoPago = EstadoPago.PARCIAL;
      } else {
        estadoPago = EstadoPago.PENDIENTE;
      }

      // C.1 Generar número de comprobante correlativo
      const numeroComprobante =
        await this.generarNumeroComprobanteVenta(empresaId);

      const comprobante = comprobanteRepo.create({
        tipo: TipoComprobante.VENTA,
        numeroComprobante,
        total: totalRedondeado,
        saldoPendiente: saldoPendienteRedondeado,
        estadoPago,
        terceroId: dto.clienteId || null,
        empresaId,
      });

      await comprobanteRepo.save(comprobante);

      // D. Crear los detalles del comprobante y descontar stock
      for (const item of dto.items) {
        // Obtener el producto con lock pesimista para evitar condiciones de carrera
        const producto = await queryRunner.manager.findOne(Producto, {
          where: { id: item.productoId, empresaId, eliminado: false },
          lock: { mode: 'pessimistic_write' }, // Bloquea la fila hasta que termine la transacción
        });

        if (!producto) {
          throw new NotFoundException(
            `Producto ${item.productoId} no encontrado`,
          );
        }

        // E. VALIDAR STOCK DISPONIBLE
        if (producto.stockActual < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para el producto "${producto.nombre}". Stock disponible: ${producto.stockActual}, solicitado: ${item.cantidad}`,
          );
        }

        // F. DESCONTAR STOCK
        producto.stockActual -= item.cantidad;
        await queryRunner.manager.save(Producto, producto);

        const subtotal = item.cantidad * item.precioUnitario;

        const detalle = queryRunner.manager.create(ComprobanteDetalle, {
          comprobanteId: comprobante.id,
          productoId: item.productoId,
          nombreProducto: producto.nombre, // Denormalización
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: this.redondear(subtotal),
          empresaId,
        });

        await queryRunner.manager.save(ComprobanteDetalle, detalle);
      }

      // F. Si montoPagado > 0, validar metodoPago y crear Cobro
      let cobro: Cobro | null = null;
      if (dto.montoPagado > 0) {
        if (!dto.metodoPago) {
          throw new BadRequestException('Debe especificar el método de pago');
        }

        cobro = cobroRepo.create({
          monto: dto.montoPagado,
          fecha: new Date(),
          metodo: dto.metodoPago,
          comprobanteId: comprobante.id,
          empresaId,
        });

        await cobroRepo.save(cobro);
      }

      // H. Si hay clienteId y saldoPendiente > 0, actualizar saldoActual del Tercero
      if (dto.clienteId && saldoPendienteRedondeado > 0) {
        await terceroRepo.increment(
          { id: dto.clienteId },
          'saldoActual',
          saldoPendienteRedondeado,
        );
      }

      // Confirmar transacción
      await queryRunner.commitTransaction();

      // G. Registrar movimiento en caja DESPUÉS del commit (para evitar FK constraint)
      if (dto.montoPagado > 0 && dto.metodoPago) {
        try {
          await this.cajaService.registrarMovimiento({
            monto: dto.montoPagado,
            tipo: TipoMovimiento.INGRESO,
            origen: OrigenMovimiento.VENTA,
            metodoPago: mapearMetodoPagoACaja(dto.metodoPago),
            descripcion: `Cobro venta ${comprobante.id.substring(0, 8)}`,
            comprobanteId: comprobante.id,
          });
          this.logger.log(
            `Movimiento de caja registrado automáticamente para venta ${comprobante.id}`,
          );
        } catch (error) {
          // Si no hay caja abierta, solo registrar advertencia pero NO fallar la venta
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          this.logger.warn(
            `No se pudo registrar movimiento en caja para venta ${comprobante.id}: ${errorMessage}`,
          );
        }
      }

      // H. Construir y retornar respuesta
      const mensaje = this.generarMensajeVenta(
        estadoPago,
        saldoPendienteRedondeado,
      );

      return {
        comprobante: {
          id: comprobante.id,
          numeroComprobante: comprobante.numeroComprobante || '',
          tipo: comprobante.tipo,
          total: comprobante.total,
          saldoPendiente: comprobante.saldoPendiente,
          estadoPago: comprobante.estadoPago,
        },
        cobro: cobro
          ? {
              id: cobro.id,
              monto: cobro.monto,
              metodo: cobro.metodo,
            }
          : null,
        mensaje,
      };
    } catch (error) {
      // Revertir transacción en caso de error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar recursos
      await queryRunner.release();
    }
  }

  /**
   * MÉTODO: Registrar Nuevo Cobro
   *
   * Registra un cobro diferido sobre un comprobante existente.
   *
   * Validaciones:
   * 1. El comprobante debe existir y pertenecer a la empresa
   * 2. El comprobante no debe estar completamente pagado
   * 3. El monto no debe exceder el saldo pendiente
   *
   * Operaciones transaccionales:
   * 1. Crear el cobro
   * 2. Actualizar saldoPendiente y estadoPago del comprobante
   * 3. Si hay tercero vinculado, actualizar su saldoActual
   *
   * @param dto Datos del cobro
   * @param empresaId ID de la empresa (tenant)
   * @returns Respuesta con cobro, estado del comprobante y mensaje
   */
  async registrarNuevoCobro(
    dto: RegistrarCobroDto,
    empresaId: string,
  ): Promise<CobroResponseDto> {
    // 1. Validar que el comprobante existe y pertenece a la empresa
    const comprobante = await this.comprobanteRepository.findOne({
      where: { id: dto.comprobanteId, empresaId, eliminado: false },
      relations: ['tercero'],
    });

    if (!comprobante) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    // 2. Validar que el comprobante no esté pagado
    if (comprobante.estadoPago === EstadoPago.PAGADO) {
      throw new BadRequestException(
        'El comprobante ya está completamente pagado',
      );
    }

    // 3. Validar que el monto no exceda el saldo pendiente
    if (dto.monto > comprobante.saldoPendiente) {
      throw new BadRequestException(
        `El monto ($${dto.monto.toFixed(2)}) excede el saldo pendiente ($${comprobante.saldoPendiente.toFixed(2)})`,
      );
    }

    // Iniciar transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const terceroRepo = queryRunner.manager.getRepository(Tercero);
      const comprobanteRepo = queryRunner.manager.getRepository(Comprobante);
      const cobroRepo = queryRunner.manager.getRepository(Cobro);

      // A. Crear el Cobro
      const cobro = cobroRepo.create({
        monto: dto.monto,
        fecha: new Date(),
        metodo: dto.metodoPago,
        comprobanteId: comprobante.id,
        empresaId,
      });

      await cobroRepo.save(cobro);

      // B. Actualizar saldoPendiente del Comprobante
      const nuevoSaldoPendiente = comprobante.saldoPendiente - dto.monto;
      const nuevoSaldoPendienteRedondeado =
        Math.round(nuevoSaldoPendiente * 100) / 100;

      const nuevoEstadoPago =
        nuevoSaldoPendienteRedondeado === 0
          ? EstadoPago.PAGADO
          : EstadoPago.PARCIAL;

      comprobante.saldoPendiente = nuevoSaldoPendienteRedondeado;
      comprobante.estadoPago = nuevoEstadoPago;

      await comprobanteRepo.save(comprobante);

      // C. Si hay tercero vinculado, actualizar su saldoActual
      if (comprobante.terceroId) {
        await terceroRepo.decrement(
          { id: comprobante.terceroId },
          'saldoActual',
          dto.monto,
        );
      }

      // Confirmar transacción
      await queryRunner.commitTransaction();

      // Registrar movimiento en caja DESPUÉS del commit
      try {
        await this.cajaService.registrarMovimiento({
          monto: dto.monto,
          tipo: TipoMovimiento.INGRESO,
          origen: OrigenMovimiento.VENTA,
          metodoPago: mapearMetodoPagoACaja(dto.metodoPago),
          descripcion: `Cobro diferido venta ${comprobante.id.substring(0, 8)}`,
          comprobanteId: comprobante.id,
        });
        this.logger.log(
          `Movimiento de caja registrado para cobro ${cobro.id} de venta ${comprobante.id}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        this.logger.warn(
          `No se pudo registrar movimiento en caja para cobro ${cobro.id}: ${errorMessage}`,
        );
      }

      // D. Construir y retornar respuesta
      const mensaje = this.generarMensajeCobro(
        nuevoEstadoPago,
        nuevoSaldoPendienteRedondeado,
      );

      return {
        cobro: {
          id: cobro.id,
          monto: cobro.monto,
          metodo: cobro.metodo,
          fecha: cobro.fecha,
        },
        comprobante: {
          id: comprobante.id,
          saldoPendiente: comprobante.saldoPendiente,
          estadoPago: comprobante.estadoPago,
        },
        mensaje,
      };
    } catch (error) {
      // Revertir transacción en caso de error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar recursos
      await queryRunner.release();
    }
  }

  /**
   * MÉTODO: Actualizar Cobro
   *
   * Actualiza el método de pago y/o la fecha de un cobro existente.
   *
   * Casos de uso:
   * - Corregir el método de pago capturado incorrectamente
   * - Ajustar la fecha del cobro
   *
   * Validaciones:
   * 1. El cobro debe existir y pertenecer a la empresa
   * 2. NO se puede actualizar el monto (esto requeriría recalcular saldos)
   *
   * @param id ID del cobro
   * @param dto Datos a actualizar
   * @param empresaId ID de la empresa (tenant)
   * @returns Cobro actualizado
   */
  async actualizarCobro(
    id: string,
    dto: ActualizarCobroDto,
    empresaId: string,
  ): Promise<CobroResponseDto> {
    // 1. Validar que el cobro existe
    const cobro = await this.cobroRepository.findOne({
      where: { id, empresaId },
      relations: ['comprobante'],
    });

    if (!cobro) {
      throw new NotFoundException(`Cobro ${id} no encontrado`);
    }

    // 2. Actualizar solo los campos enviados
    if (dto.metodoPago !== undefined) {
      cobro.metodo = dto.metodoPago;
    }

    if (dto.fecha !== undefined) {
      cobro.fecha = new Date(dto.fecha);
    }

    // 3. Si no hay cambios, retornar el cobro actual
    if (dto.metodoPago === undefined && dto.fecha === undefined) {
      return {
        cobro: {
          id: cobro.id,
          monto: cobro.monto,
          metodo: cobro.metodo,
          fecha: cobro.fecha,
        },
        comprobante: {
          id: cobro.comprobante.id,
          saldoPendiente: cobro.comprobante.saldoPendiente,
          estadoPago: cobro.comprobante.estadoPago,
        },
        mensaje: 'Cobro sin cambios',
      };
    }

    // 4. Guardar cambios
    const cobroActualizado = await this.cobroRepository.save(cobro);

    // 5. Retornar respuesta
    return {
      cobro: {
        id: cobroActualizado.id,
        monto: cobroActualizado.monto,
        metodo: cobroActualizado.metodo,
        fecha: cobroActualizado.fecha,
      },
      comprobante: {
        id: cobro.comprobante.id,
        saldoPendiente: cobro.comprobante.saldoPendiente,
        estadoPago: cobro.comprobante.estadoPago,
      },
      mensaje: 'Cobro actualizado exitosamente',
    };
  }

  /**
   * MÉTODO: Obtener Detalle de Venta
   *
   * Retorna el detalle completo de una venta incluyendo:
   * - Información del comprobante
   * - Cliente (si existe)
   * - Items vendidos
   * - Historial de cobros
   *
   * @param id ID del comprobante
   * @param empresaId ID de la empresa (tenant)
   * @returns Detalle completo de la venta
   */
  async getDetalleVenta(
    id: string,
    empresaId: string,
  ): Promise<DetalleVentaResponseDto> {
    const comprobante = await this.comprobanteRepository.findOne({
      where: { id, empresaId, eliminado: false },
      relations: ['tercero', 'detalles', 'detalles.producto', 'cobros'],
      order: {
        detalles: { createdAt: 'ASC' },
        cobros: { fecha: 'ASC' },
      },
    });

    if (!comprobante) {
      throw new NotFoundException(`Comprobante ${id} no encontrado`);
    }

    return {
      id: comprobante.id,
      tipo: comprobante.tipo,
      total: comprobante.total,
      saldoPendiente: comprobante.saldoPendiente,
      estadoPago: comprobante.estadoPago,
      tercero: comprobante.tercero
        ? {
            id: comprobante.tercero.id,
            nombre: comprobante.tercero.nombre,
          }
        : undefined,
      detalles: comprobante.detalles.map((d) => ({
        productoId: d.productoId,
        nombreProducto: d.nombreProducto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.subtotal,
      })),
      cobros: comprobante.cobros.map((c) => ({
        id: c.id,
        monto: c.monto,
        metodo: c.metodo,
        fecha: c.fecha,
      })),
      createdAt: comprobante.createdAt,
    };
  }

  /**
   * MÉTODO: Obtener Deudas de Cliente
   *
   * Retorna todas las ventas con saldo pendiente de un cliente específico.
   * Útil para visualizar la cuenta corriente del cliente.
   *
   * @param clienteId ID del cliente
   * @param empresaId ID de la empresa (tenant)
   * @returns Lista de comprobantes con deuda pendiente
   */
  async getDeudasCliente(
    clienteId: string,
    empresaId: string,
  ): Promise<DeudaClienteDto[]> {
    // Validar que el tercero existe y es cliente
    const tercero = await this.terceroRepository.findOne({
      where: {
        id: clienteId,
        empresaId,
        tipo: TipoTercero.CLIENTE,
        eliminado: false,
      },
    });

    if (!tercero) {
      throw new NotFoundException(`Cliente ${clienteId} no encontrado`);
    }

    // Buscar comprobantes con deuda
    const comprobantes = await this.comprobanteRepository.find({
      where: {
        terceroId: clienteId,
        empresaId,
        eliminado: false,
        estadoPago: In([EstadoPago.PENDIENTE, EstadoPago.PARCIAL]),
      },
      select: ['id', 'createdAt', 'total', 'saldoPendiente', 'estadoPago'],
      order: { createdAt: 'ASC' }, // Deudas más viejas primero
    });

    return comprobantes.map((c) => ({
      id: c.id,
      fecha: c.createdAt,
      total: c.total,
      saldoPendiente: c.saldoPendiente,
      estadoPago: c.estadoPago,
    }));
  }

  /**
   * MÉTODO: Actualizar Comprobante
   *
   * Actualiza el tercero asociado a un comprobante (venta).
   *
   * Casos de uso:
   * - Asignar un cliente a una venta anónima
   * - Cambiar el cliente de una venta
   * - Convertir una venta de cliente a anónima (terceroId = null)
   *
   * Validaciones:
   * 1. El comprobante debe existir y pertenecer a la empresa
   * 2. Si se asigna un tercero, debe existir y ser tipo CLIENTE
   * 3. Solo se puede cambiar si no hay saldo pendiente (para mantener integridad de saldos)
   *
   * Operaciones transaccionales:
   * 1. Validar comprobante
   * 2. Validar nuevo tercero (si aplica)
   * 3. Ajustar saldos de terceros si es necesario
   * 4. Actualizar terceroId del comprobante
   *
   * @param id ID del comprobante
   * @param dto Datos a actualizar
   * @param empresaId ID de la empresa (tenant)
   * @returns Comprobante actualizado
   */
  async actualizarComprobante(
    id: string,
    dto: ActualizarComprobanteDto,
    empresaId: string,
  ): Promise<DetalleVentaResponseDto> {
    // 1. Validar que el comprobante existe
    const comprobante = await this.comprobanteRepository.findOne({
      where: { id, empresaId, eliminado: false },
      relations: ['tercero'],
    });

    if (!comprobante) {
      throw new NotFoundException(`Comprobante ${id} no encontrado`);
    }

    // 2. Si no hay cambios, retornar el comprobante actual
    if (dto.terceroId === undefined) {
      return this.getDetalleVenta(id, empresaId);
    }

    // 3. Validar que no tenga saldo pendiente (para mantener integridad)
    if (comprobante.saldoPendiente > 0) {
      throw new BadRequestException(
        'No se puede cambiar el cliente de un comprobante con saldo pendiente. Primero debe saldarse la deuda.',
      );
    }

    // 4. Si se proporciona un nuevo terceroId, validar que existe y es cliente
    if (dto.terceroId) {
      const nuevoTercero = await this.terceroRepository.findOne({
        where: {
          id: dto.terceroId,
          empresaId,
          tipo: TipoTercero.CLIENTE,
          eliminado: false,
        },
      });

      if (!nuevoTercero) {
        throw new NotFoundException(`Cliente ${dto.terceroId} no encontrado`);
      }
    }

    // 5. Actualizar el comprobante
    comprobante.terceroId = dto.terceroId || null;
    await this.comprobanteRepository.save(comprobante);

    // 6. Retornar el comprobante actualizado con detalles completos
    return this.getDetalleVenta(id, empresaId);
  }

  /**
   * MÉTODO: Listar Ventas
   *
   * Obtiene un listado de ventas con filtros opcionales.
   *
   * Filtros disponibles:
   * - estadoPago: Filtra por estado de pago (PENDIENTE, PARCIAL, PAGADO)
   * - clienteId: Filtra por cliente específico
   * - fechaDesde: Filtra ventas desde esta fecha
   * - fechaHasta: Filtra ventas hasta esta fecha
   *
   * Ordenamiento:
   * - Por fecha de creación (DESC) - más recientes primero
   *
   * @param query Filtros de búsqueda
   * @param empresaId ID de la empresa (tenant)
   * @returns Lista de ventas con información resumida
   */
  async listarVentas(
    query: ListarVentasQueryDto,
    empresaId: string,
  ): Promise<VentaListItemDto[]> {
    const where: FindOptionsWhere<Comprobante> = {
      empresaId,
      eliminado: false,
      tipo: TipoComprobante.VENTA, // Solo ventas, no cotizaciones
    };

    // A. Aplicar filtro por estado de pago si existe
    if (query.estadoPago) {
      where.estadoPago = query.estadoPago;
    }

    // B. Aplicar filtro por cliente si existe
    if (query.clienteId) {
      where.terceroId = query.clienteId;
    }

    // C. Aplicar filtros de fecha
    if (query.fechaDesde && query.fechaHasta) {
      // Rango de fechas completo
      const fechaDesde = new Date(query.fechaDesde);
      fechaDesde.setHours(0, 0, 0, 0);

      const fechaHasta = new Date(query.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);

      where.createdAt = Between(fechaDesde, fechaHasta);
    } else if (query.fechaDesde) {
      // Solo desde fecha
      const fechaDesde = new Date(query.fechaDesde);
      fechaDesde.setHours(0, 0, 0, 0);

      where.createdAt = MoreThanOrEqual(fechaDesde) as any;
    } else if (query.fechaHasta) {
      // Solo hasta fecha
      const fechaHasta = new Date(query.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);

      where.createdAt = LessThanOrEqual(fechaHasta) as any;
    }

    // D. Buscar comprobantes con filtros aplicados
    const comprobantes = await this.comprobanteRepository.find({
      where,
      relations: ['tercero', 'detalles'],
      order: { createdAt: 'DESC' }, // Más recientes primero
    });

    // E. Mapear a DTO de respuesta
    return comprobantes.map((c) => ({
      id: c.id,
      tipo: c.tipo,
      total: c.total,
      saldoPendiente: c.saldoPendiente,
      estadoPago: c.estadoPago,
      tercero: c.tercero
        ? {
            id: c.tercero.id,
            nombre: c.tercero.nombre,
          }
        : undefined,
      cantidadItems: c.detalles?.length || 0,
      createdAt: c.createdAt,
    }));
  }

  /**
   * MÉTODO: Listar Cobros Para Exportar
   *
   * Obtiene todos los cobros realizados durante la sesión de caja actual.
   * Útil para generar reportes y exportaciones de estado financiero en tiempo real.
   *
   * Validaciones:
   * - Debe existir una sesión de caja ABIERTA
   *
   * Proceso:
   * 1. Obtener sesión actual de caja
   * 2. Consultar cobros en el rango de fechas de la sesión
   * 3. Calcular resumen por método de pago
   * 4. Retornar datos estructurados para exportación
   *
   * @param empresaId ID de la empresa (tenant)
   * @returns Datos completos para exportación (sesión, cobros, resumen)
   * @throws BadRequestException si no hay sesión de caja abierta
   */
  async listarCobrosParaExportar(
    empresaId: string,
  ): Promise<ExportarCobrosResponseDto> {
    // 1. Obtener sesión actual de caja
    const sesionActual = await this.cajaService.obtenerSesionActual();

    if (!sesionActual) {
      throw new BadRequestException(
        'No hay una sesión de caja abierta. Debe abrir caja para exportar cobros.',
      );
    }

    // 2. Consultar cobros en el rango de fechas de la sesión
    const fechaConsulta = new Date();
    const fechaAperturaCaja = new Date(sesionActual.fechaApertura);

    const cobros = await this.cobroRepository.find({
      where: {
        empresaId,
        fecha: Between(fechaAperturaCaja, fechaConsulta) as any,
      },
      relations: ['comprobante', 'comprobante.tercero'],
      order: { fecha: 'ASC' }, // Ordenar cronológicamente
    });

    // 3. Mapear cobros a DTO de exportación
    const cobrosExport: CobroExportDto[] = cobros.map((cobro) => ({
      id: cobro.id,
      fecha: cobro.fecha,
      monto: cobro.monto,
      metodo: cobro.metodo,
      comprobante: {
        id: cobro.comprobante.id,
        total: cobro.comprobante.total,
      },
      cliente: cobro.comprobante.tercero
        ? { nombre: cobro.comprobante.tercero.nombre }
        : null,
    }));

    // 4. Calcular resumen por método de pago
    const resumenPorMetodo: ResumenPorMetodoDto = {
      EFECTIVO: 0,
      QR: 0,
      TARJETA: 0,
      TRANSFERENCIA: 0,
    };

    let totalMonto = 0;

    cobros.forEach((cobro) => {
      totalMonto += cobro.monto;
      resumenPorMetodo[cobro.metodo] += cobro.monto;
    });

    // Redondear totales a 2 decimales
    resumenPorMetodo.EFECTIVO = this.redondear(resumenPorMetodo.EFECTIVO);
    resumenPorMetodo.QR = this.redondear(resumenPorMetodo.QR);
    resumenPorMetodo.TARJETA = this.redondear(resumenPorMetodo.TARJETA);
    resumenPorMetodo.TRANSFERENCIA = this.redondear(
      resumenPorMetodo.TRANSFERENCIA,
    );
    totalMonto = this.redondear(totalMonto);

    // 5. Construir objeto de sesión info
    const sesionInfo: SesionInfoDto = {
      id: sesionActual.id,
      fechaApertura: fechaAperturaCaja,
      fechaConsulta,
      estado: sesionActual.estado as string,
    };

    // 6. Construir resumen
    const resumen: ResumenCobrosDto = {
      totalCobros: cobros.length,
      totalMonto,
      porMetodo: resumenPorMetodo,
    };

    // 7. Retornar respuesta completa
    return {
      sesion: sesionInfo,
      cobros: cobrosExport,
      resumen,
    };
  }

  /**
   * MÉTODO: Anular Venta
   *
   * Anula una venta existente realizando las siguientes operaciones atómicas:
   *
   * 1. Validar que el comprobante existe, no está eliminado, es tipo VENTA
   * 2. Validar que pertenece a la sesión de caja actual
   * 3. Soft delete del comprobante (eliminado=true)
   * 4. Revertir stock de cada producto vendido
   * 5. Crear movimiento EGRESO/DEVOLUCION en caja
   * 6. Ajustar saldo del cliente si aplica
   *
   * @param comprobanteId ID del comprobante a anular
   * @param dto Datos de anulación (motivo)
   * @param empresaId ID de la empresa (tenant)
   * @param sesionCajaId ID de la sesión de caja actual
   * @returns Respuesta con información de la anulación
   */
  async anularVenta(
    comprobanteId: string,
    dto: AnularVentaDto,
    empresaId: string,
    sesionCajaId: string,
  ): Promise<AnularVentaResponseDto> {
    // 1. Buscar el comprobante con sus relaciones
    const comprobante = await this.comprobanteRepository.findOne({
      where: {
        id: comprobanteId,
        empresaId,
        eliminado: false,
        tipo: TipoComprobante.VENTA,
      },
      relations: ['tercero', 'detalles', 'cobros'],
    });

    if (!comprobante) {
      throw new NotFoundException(
        'Comprobante no encontrado o ya fue anulado',
      );
    }

    // 2. Validar que existe sesión de caja abierta
    const sesionActual = await this.cajaService.obtenerSesionActual();
    if (!sesionActual) {
      throw new BadRequestException(
        'No hay una sesión de caja abierta. Debe abrir caja para anular ventas.',
      );
    }

    if (sesionActual.id !== sesionCajaId) {
      throw new BadRequestException(
        'La sesión de caja no coincide con la sesión actual.',
      );
    }

    // Iniciar transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const comprobanteRepo = queryRunner.manager.getRepository(Comprobante);
      const terceroRepo = queryRunner.manager.getRepository(Tercero);

      // 3. Soft delete del comprobante
      comprobante.eliminado = true;
      comprobante.deletedAt = new Date();
      await comprobanteRepo.save(comprobante);

      // 4. Revertir stock de cada producto
      let productosRevertidos = 0;
      for (const detalle of comprobante.detalles) {
        const producto = await queryRunner.manager.findOne(Producto, {
          where: { id: detalle.productoId, empresaId },
          lock: { mode: 'pessimistic_write' },
        });

        if (producto) {
          producto.stockActual += detalle.cantidad;
          await queryRunner.manager.save(Producto, producto);
          productosRevertidos++;
        }
      }

      // 5. Calcular monto total cobrado para la devolución
      const totalCobrado = comprobante.cobros.reduce(
        (sum, cobro) => sum + cobro.monto,
        0,
      );

      // 6. Crear movimiento EGRESO/DEVOLUCION en caja (si hubo cobros)
      let movimientoDevolucion: {
        id: string;
        monto: number;
        tipo: string;
        origen: string;
      } | null = null;
      if (totalCobrado > 0) {
        try {
          const movimiento = await this.cajaService.registrarMovimiento({
            monto: totalCobrado,
            tipo: TipoMovimiento.EGRESO,
            origen: OrigenMovimiento.DEVOLUCION,
            metodoPago: comprobante.cobros[0]
              ? mapearMetodoPagoACaja(comprobante.cobros[0].metodo)
              : mapearMetodoPagoACaja('EFECTIVO' as any),
            descripcion: `ANULACIÓN: ${dto.motivoAnulacion.substring(0, 100)} - Venta ${comprobante.id.substring(0, 8)}`,
            comprobanteId: comprobante.id,
          });

          movimientoDevolucion = {
            id: movimiento.id,
            monto: movimiento.monto,
            tipo: movimiento.tipo,
            origen: movimiento.origen,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          this.logger.warn(
            `No se pudo registrar movimiento de devolución en caja: ${errorMessage}`,
          );
        }
      }

      // 7. Ajustar saldo del tercero si aplica
      let saldoClienteAjustado: number | null = null;
      if (comprobante.terceroId && comprobante.saldoPendiente > 0) {
        // Si había saldo pendiente, reducirlo del saldo del cliente
        await terceroRepo.decrement(
          { id: comprobante.terceroId },
          'saldoActual',
          comprobante.saldoPendiente,
        );
        saldoClienteAjustado = -comprobante.saldoPendiente;
      }

      // Confirmar transacción
      await queryRunner.commitTransaction();

      this.logger.log(
        `Venta ${comprobante.id} anulada exitosamente. Motivo: ${dto.motivoAnulacion}`,
      );

      return {
        comprobante: {
          id: comprobante.id,
          total: comprobante.total,
          estadoPago: comprobante.estadoPago,
        },
        movimientoDevolucion,
        productosRevertidos,
        saldoClienteAjustado,
        mensaje: `Venta anulada exitosamente. Stock revertido para ${productosRevertidos} producto(s).${totalCobrado > 0 ? ` Devolución de $${totalCobrado.toFixed(2)} registrada.` : ''}`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Helper: Redondear a 2 decimales
   */
  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  /**
   * Genera un mensaje descriptivo para la respuesta de venta
   */
  private generarMensajeVenta(
    estadoPago: EstadoPago,
    saldoPendiente: number,
  ): string {
    switch (estadoPago) {
      case EstadoPago.PAGADO:
        return 'Venta registrada exitosamente. Pago completo.';
      case EstadoPago.PARCIAL:
        return `Venta registrada exitosamente. Saldo pendiente: $${saldoPendiente.toFixed(2)}`;
      case EstadoPago.PENDIENTE:
        return `Venta registrada exitosamente. Saldo pendiente: $${saldoPendiente.toFixed(2)}`;
      default:
        return 'Venta registrada exitosamente.';
    }
  }

  /**
   * Genera un mensaje descriptivo para la respuesta de cobro
   */
  private generarMensajeCobro(
    estadoPago: EstadoPago,
    saldoPendiente: number,
  ): string {
    if (estadoPago === EstadoPago.PAGADO) {
      return 'Cobro registrado exitosamente. Comprobante pagado completamente.';
    } else {
      return `Cobro registrado exitosamente. Saldo pendiente: $${saldoPendiente.toFixed(2)}`;
    }
  }

  /**
   * Genera número de comprobante correlativo para ventas
   * Formato: VTA-0001, VTA-0002, etc.
   */
  private async generarNumeroComprobanteVenta(
    empresaId: string,
  ): Promise<string> {
    // Obtener última venta de la empresa
    const ultimaVenta = await this.comprobanteRepository.findOne({
      where: {
        empresaId,
        tipo: TipoComprobante.VENTA,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    let numero = 1;

    if (ultimaVenta && ultimaVenta.numeroComprobante) {
      // Extraer número del formato VTA-0001
      const match = ultimaVenta.numeroComprobante.match(/VTA-(\d+)/);
      if (match) {
        numero = parseInt(match[1], 10) + 1;
      }
    }

    // Formatear número con padding de 4 dígitos
    return `VTA-${numero.toString().padStart(4, '0')}`;
  }
}
