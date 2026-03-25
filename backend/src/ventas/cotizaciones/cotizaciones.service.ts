import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comprobante } from '../entities/comprobante.entity';
import { ComprobanteDetalle } from '../entities/comprobante-detalle.entity';
import { Tercero } from '../entities/tercero.entity';
import { TipoComprobante, EstadoPago } from '../enums';
import { VentasService } from '../ventas.service';
import { CrearVentaDto } from '../dto/crear-venta.dto';
import { VentaResponseDto } from '../dto/venta-response.dto';
import {
  CrearCotizacionDto,
  ActualizarCotizacionDto,
  ListarCotizacionesQueryDto,
  CotizacionResponseDto,
  DetalleCotizacionResponseDto,
  CotizacionListItemDto,
  GenerarVentaDesdeCotizacionDto,
} from './dto';

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectRepository(Comprobante)
    private comprobanteRepo: Repository<Comprobante>,
    @InjectRepository(ComprobanteDetalle)
    private detalleRepo: Repository<ComprobanteDetalle>,
    @InjectRepository(Tercero)
    private terceroRepo: Repository<Tercero>,
    @Inject(forwardRef(() => VentasService))
    private ventasService: VentasService,
  ) {}

  /**
   * Crear una nueva cotización
   */
  async crearCotizacion(
    dto: CrearCotizacionDto,
    empresaId: string,
    usuarioNombre: string,
  ): Promise<CotizacionResponseDto> {
    // Validar items no vacíos
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'La cotización debe tener al menos un item',
      );
    }

    // Calcular total
    const total = dto.items.reduce((sum, item) => sum + item.subtotal, 0);

    // Calcular fecha de vencimiento (+ 15 días)
    const fechaVencimiento = new Date(dto.fechaEmision);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);

    // Generar número correlativo
    const numeroComprobante = await this.generarNumeroCorrelativo(empresaId);

    // Validar cálculo de subtotales
    dto.items.forEach((item) => {
      const subtotalCalculado = item.cantidad * item.precioUnitario;
      if (Math.abs(item.subtotal - subtotalCalculado) > 0.01) {
        throw new BadRequestException(
          `El subtotal del item ${item.nombreProducto} no coincide con cantidad × precio`,
        );
      }
    });

    // Crear comprobante
    const comprobante = this.comprobanteRepo.create({
      tipo: TipoComprobante.COTIZACION,
      numeroComprobante,
      total,
      saldoPendiente: 0, // No aplica para cotizaciones
      estadoPago: EstadoPago.PENDIENTE, // Valor por defecto para cotizaciones
      clienteNombre: dto.clienteNombre,
      terceroId: dto.clienteId || null,
      fechaVencimiento,
      usuarioEmisor: usuarioNombre,
      empresaId,
      createdAt: dto.fechaEmision,
      eliminado: false,
    });

    // Crear detalles
    const detalles = dto.items.map((item) =>
      this.detalleRepo.create({
        productoId: item.productoId,
        nombreProducto: item.nombreProducto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
        empresaId,
      }),
    );

    comprobante.detalles = detalles;

    // Guardar
    const cotizacionGuardada = await this.comprobanteRepo.save(comprobante);

    return {
      cotizacion: cotizacionGuardada,
      mensaje: 'Cotización creada exitosamente',
    };
  }

  /**
   * Listar cotizaciones con filtros
   */
  async listarCotizaciones(
    empresaId: string,
    query?: ListarCotizacionesQueryDto,
  ): Promise<CotizacionListItemDto[]> {
    const qb = this.comprobanteRepo
      .createQueryBuilder('comprobante')
      .where('comprobante.empresaId = :empresaId', { empresaId })
      .andWhere('comprobante.tipo = :tipo', {
        tipo: TipoComprobante.COTIZACION,
      })
      .andWhere('comprobante.eliminado = :eliminado', { eliminado: false });

    // Filtro por fecha
    if (query?.fechaDesde) {
      qb.andWhere('comprobante.createdAt >= :fechaDesde', {
        fechaDesde: new Date(query.fechaDesde),
      });
    }

    if (query?.fechaHasta) {
      qb.andWhere('comprobante.createdAt <= :fechaHasta', {
        fechaHasta: new Date(query.fechaHasta),
      });
    }

    // Filtro por nombre de cliente
    if (query?.clienteNombre) {
      qb.andWhere('comprobante.clienteNombre ILIKE :clienteNombre', {
        clienteNombre: `%${query.clienteNombre}%`,
      });
    }

    // Ordenar por fecha descendente
    qb.orderBy('comprobante.createdAt', 'DESC');

    const cotizaciones = await qb.getMany();

    // Mapear a DTO
    return cotizaciones.map((c) => ({
      id: c.id,
      numeroComprobante: c.numeroComprobante || '',
      clienteNombre: c.clienteNombre || 'Sin nombre',
      fechaEmision: c.createdAt,
      fechaVencimiento: c.fechaVencimiento || c.createdAt,
      total: c.total,
      convertidaAVenta: c.convertidaAVenta,
      createdAt: c.createdAt,
    }));
  }

  /**
   * Obtener detalle de cotización por ID
   */
  async obtenerDetalleCotizacion(
    id: string,
    empresaId: string,
  ): Promise<DetalleCotizacionResponseDto> {
    const cotizacion = await this.comprobanteRepo.findOne({
      where: {
        id,
        empresaId,
        tipo: TipoComprobante.COTIZACION,
        eliminado: false,
      },
      relations: ['detalles', 'empresa'],
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }

    return {
      id: cotizacion.id,
      numeroComprobante: cotizacion.numeroComprobante || '',
      clienteNombre: cotizacion.clienteNombre || 'Sin nombre',
      clienteId: cotizacion.terceroId,
      fechaEmision: cotizacion.createdAt,
      fechaVencimiento: cotizacion.fechaVencimiento || cotizacion.createdAt,
      items: cotizacion.detalles.map((d) => ({
        id: d.id,
        productoId: d.productoId,
        nombreProducto: d.nombreProducto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.subtotal,
      })),
      total: cotizacion.total,
      usuarioEmisor: cotizacion.usuarioEmisor || 'Sistema',
      empresaNombre: cotizacion.empresa.razonSocial,
      createdAt: cotizacion.createdAt,
    };
  }

  /**
   * Actualizar cotización
   */
  async actualizarCotizacion(
    id: string,
    dto: ActualizarCotizacionDto,
    empresaId: string,
  ): Promise<CotizacionResponseDto> {
    try {
      const cotizacion = await this.comprobanteRepo.findOne({
        where: {
          id,
          empresaId,
          tipo: TipoComprobante.COTIZACION,
          eliminado: false,
        },
        relations: ['detalles'],
      });

      if (!cotizacion) {
        throw new NotFoundException('Cotización no encontrada');
      }

      // Actualizar datos básicos
      if (dto.clienteNombre) {
        cotizacion.clienteNombre = dto.clienteNombre;
      }

      if (dto.clienteId !== undefined) {
        cotizacion.terceroId = dto.clienteId || null;
      }

      // Actualizar items si se proporcionan
      if (dto.items && dto.items.length > 0) {
        // Validar cálculo de subtotales
        dto.items.forEach((item) => {
          const subtotalCalculado = item.cantidad * item.precioUnitario;
          if (Math.abs(item.subtotal - subtotalCalculado) > 0.01) {
            throw new BadRequestException(
              `El subtotal del item ${item.nombreProducto} no coincide con cantidad × precio`,
            );
          }
        });

        const itemsActualizados = dto.items; // Variable local para uso en transacción

        // Usar transacción para actualización atómica
        await this.comprobanteRepo.manager.transaction(async (manager) => {
          // Eliminar detalles anteriores
          await manager.delete(ComprobanteDetalle, {
            comprobanteId: cotizacion.id,
          });

          // Crear nuevos detalles
          const nuevosDetalles = itemsActualizados.map((item) =>
            manager.create(ComprobanteDetalle, {
              productoId: item.productoId,
              nombreProducto: item.nombreProducto,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.subtotal,
              empresaId,
              comprobanteId: cotizacion.id,
            }),
          );

          await manager.save(ComprobanteDetalle, nuevosDetalles);

          // Recalcular total
          const nuevoTotal = itemsActualizados.reduce(
            (sum, item) => sum + item.subtotal,
            0,
          );

          // Actualizar el comprobante usando update() para evitar problemas con la relación
          await manager.update(Comprobante, cotizacion.id, {
            clienteNombre: cotizacion.clienteNombre,
            terceroId: cotizacion.terceroId,
            total: nuevoTotal,
          });
        });
      } else {
        // Guardar cambios sin transacción si solo se actualiza info básica
        await this.comprobanteRepo.save(cotizacion);
      }

      return {
        cotizacion,
        mensaje: 'Cotización actualizada exitosamente',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar cotización (soft delete)
   */
  async eliminarCotizacion(id: string, empresaId: string): Promise<void> {
    const cotizacion = await this.comprobanteRepo.findOne({
      where: {
        id,
        empresaId,
        tipo: TipoComprobante.COTIZACION,
        eliminado: false,
      },
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }

    // Soft delete
    cotizacion.eliminado = true;
    cotizacion.deletedAt = new Date();

    await this.comprobanteRepo.save(cotizacion);
  }

  /**
   * Generar una venta desde una cotización
   */
  async generarVentaDesdeCotizacion(
    cotizacionId: string,
    dto: GenerarVentaDesdeCotizacionDto,
    empresaId: string,
    usuarioId?: string,
  ): Promise<VentaResponseDto> {
    // Obtener cotización con sus detalles
    const cotizacion = await this.comprobanteRepo.findOne({
      where: {
        id: cotizacionId,
        empresaId,
        tipo: TipoComprobante.COTIZACION,
        eliminado: false,
      },
      relations: ['detalles'],
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }

    // Validar que la cotización tenga items
    if (!cotizacion.detalles || cotizacion.detalles.length === 0) {
      throw new BadRequestException(
        'La cotización no tiene items para convertir en venta',
      );
    }

    // Validar que si hay montoPagado > 0, debe especificar metodoPago
    if (dto.montoPagado > 0 && !dto.metodoPago) {
      throw new BadRequestException(
        'Debe especificar el método de pago si el monto pagado es mayor a 0',
      );
    }

    // Validar que montoPagado no exceda el total
    if (dto.montoPagado > cotizacion.total) {
      throw new BadRequestException(
        'El monto pagado no puede ser mayor al total de la cotización',
      );
    }

    // Crear DTO de venta a partir de la cotización
    const crearVentaDto: CrearVentaDto = {
      clienteId: cotizacion.terceroId || undefined,
      items: cotizacion.detalles.map((detalle) => ({
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
      })),
      montoPagado: dto.montoPagado,
      metodoPago: dto.metodoPago,
    };

    // Crear la venta usando el servicio de ventas
    const ventaResponse = await this.ventasService.crearVenta(
      crearVentaDto,
      empresaId,
      usuarioId,
    );

    // Marcar la cotización como convertida a venta
    cotizacion.convertidaAVenta = true;
    await this.comprobanteRepo.save(cotizacion);

    return ventaResponse;
  }

  /**
   * Generar número correlativo de cotización
   */
  private async generarNumeroCorrelativo(empresaId: string): Promise<string> {
    // Obtener última cotización de la empresa
    const ultimaCotizacion = await this.comprobanteRepo.findOne({
      where: {
        empresaId,
        tipo: TipoComprobante.COTIZACION,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    let numero = 1;

    if (ultimaCotizacion && ultimaCotizacion.numeroComprobante) {
      // Extraer número del formato COT-0001
      const match = ultimaCotizacion.numeroComprobante.match(/COT-(\d+)/);
      if (match) {
        numero = parseInt(match[1], 10) + 1;
      }
    }

    // Formatear con ceros a la izquierda
    return `COT-${numero.toString().padStart(4, '0')}`;
  }
}
