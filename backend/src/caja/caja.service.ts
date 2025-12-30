import { Injectable, Scope, Inject, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { TenantBaseService } from '../common/services/tenant-base.service';
import { CajaSesion } from './entities/caja-sesion.entity';
import { MovimientoCaja } from './entities/movimiento-caja.entity';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import {
  AbrirCajaDto,
  CerrarCajaDto,
  CrearMovimientoDto,
  SesionResponseDto,
} from './dto';
import {
  EstadoCaja,
  TipoMovimiento,
  OrigenMovimiento,
  MetodoPagoCaja,
} from './enums';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * CAJA SERVICE
 *
 * Servicio para gestión de caja (tesorería) con multi-tenancy.
 *
 * Funcionalidades principales:
 * - Apertura/cierre de sesiones de caja
 * - Registro de movimientos (ingresos/egresos)
 * - Cálculo automático de saldos
 * - Control de diferencias (sobrante/faltante)
 * - Generación de reportes diarios
 *
 * IMPORTANTE: Solo puede haber UNA sesión ABIERTA por empresa al mismo tiempo.
 */
@Injectable({ scope: Scope.REQUEST })
export class CajaService extends TenantBaseService<CajaSesion> {
  constructor(
    @InjectRepository(CajaSesion)
    repository: Repository<CajaSesion>,
    @InjectRepository(MovimientoCaja)
    private movimientoRepository: Repository<MovimientoCaja>,
    @Inject(REQUEST) request: RequestWithUser,
  ) {
    super(repository, request as Request);
  }

  /**
   * Obtiene el usuarioId del request actual (del JWT).
   */
  private get usuarioId(): string {
    const request = this.request as RequestWithUser;
    const user = request.user;
    if (!user || !user.userId) {
      throw new Error('Usuario no encontrado en request');
    }
    return user.userId;
  }

  /**
   * ABRIR CAJA
   *
   * Abre una nueva sesión de caja.
   *
   * Validaciones:
   * - NO debe existir una sesión ABIERTA para la empresa
   *
   * Proceso:
   * 1. Verificar que no existe sesión abierta
   * 2. Crear nueva sesión con estado ABIERTA
   * 3. Crear movimiento automático de APERTURA (INGRESO/EFECTIVO)
   *
   * @param dto - Datos para abrir la caja (montoInicial)
   * @returns Sesión de caja creada
   * @throws BadRequestException si ya existe una sesión abierta
   */
  async abrirCaja(dto: AbrirCajaDto): Promise<SesionResponseDto> {
    // 1. Verificar que NO existe sesión abierta
    const sesionAbiertaExiste = await this.exists({
      estado: EstadoCaja.ABIERTA,
    } as any);

    if (sesionAbiertaExiste) {
      throw new BadRequestException(
        'Ya existe una sesión de caja abierta. Debe cerrarla antes de abrir una nueva.',
      );
    }

    // 2. Crear nueva sesión
    const sesion = this.repository.create({
      montoInicial: dto.montoInicial,
      montoFinalSistema: dto.montoInicial, // Inicialmente = montoInicial
      fechaApertura: new Date(),
      estado: EstadoCaja.ABIERTA,
      usuarioId: this.usuarioId,
      empresaId: this.empresaId,
    });

    const sesionGuardada = await this.repository.save(sesion);

    // 3. Crear movimiento automático de APERTURA
    const movimientoApertura = this.movimientoRepository.create({
      sesionId: sesionGuardada.id,
      fecha: new Date(),
      monto: dto.montoInicial,
      tipo: TipoMovimiento.INGRESO,
      origen: OrigenMovimiento.APERTURA,
      metodoPago: MetodoPagoCaja.EFECTIVO,
      descripcion: `Apertura de caja con monto inicial de ${dto.montoInicial}`,
      empresaId: this.empresaId,
    });

    await this.movimientoRepository.save(movimientoApertura);

    // ✅ Convertir a DTO para garantizar serialización correcta
    return SesionResponseDto.fromEntity(sesionGuardada);
  }

  /**
   * OBTENER SESIÓN ACTUAL ABIERTA (USO PÚBLICO - DEVUELVE DTO)
   *
   * Busca la sesión que está actualmente abierta para la empresa.
   *
   * @returns Sesión abierta como DTO o null si no existe
   */
  async obtenerSesionActual(): Promise<SesionResponseDto | null> {
    const sesion = await this._obtenerSesionActualEntity();
    // ✅ Convertir a DTO si existe, garantizando que el campo 'estado' se incluya
    return sesion ? SesionResponseDto.fromEntity(sesion) : null;
  }

  /**
   * OBTENER SESIÓN ACTUAL ABIERTA (USO INTERNO - DEVUELVE ENTIDAD)
   *
   * Método privado para obtener la entidad completa, usado internamente
   * para operaciones que necesitan modificar la sesión.
   *
   * @returns Sesión abierta como entidad o null si no existe
   */
  private async _obtenerSesionActualEntity(): Promise<CajaSesion | null> {
    return this.repository.findOne({
      where: this.buildTenantWhere({ estado: EstadoCaja.ABIERTA } as any),
      relations: ['usuario'],
    });
  }

  /**
   * REGISTRAR MOVIMIENTO
   *
   * Registra un nuevo movimiento en la sesión de caja actual.
   * Método interno para ser llamado por el módulo de Ventas cuando haya cobros.
   *
   * Validaciones:
   * - Debe existir una sesión ABIERTA
   *
   * Proceso:
   * 1. Buscar sesión abierta
   * 2. Crear movimiento
   * 3. Actualizar montoFinalSistema SOLO si es EFECTIVO
   *
   * @param dto - Datos del movimiento
   * @returns Movimiento creado
   * @throws BadRequestException si no hay sesión abierta
   */
  async registrarMovimiento(dto: CrearMovimientoDto): Promise<MovimientoCaja> {
    // 1. Buscar sesión abierta (usar método interno que devuelve entidad)
    const sesionAbierta = await this._obtenerSesionActualEntity();

    if (!sesionAbierta) {
      throw new BadRequestException(
        'No hay una sesión de caja abierta. Debe abrir caja antes de registrar movimientos.',
      );
    }

    // 2. Crear movimiento
    const movimiento = this.movimientoRepository.create({
      sesionId: sesionAbierta.id,
      fecha: new Date(),
      monto: dto.monto,
      tipo: dto.tipo,
      origen: dto.origen,
      metodoPago: dto.metodoPago,
      descripcion: dto.descripcion,
      empresaId: this.empresaId,
    });

    const movimientoGuardado = await this.movimientoRepository.save(movimiento);

    // 3. Actualizar saldo SOLO si es EFECTIVO
    if (dto.metodoPago === MetodoPagoCaja.EFECTIVO) {
      const saldoActual =
        sesionAbierta.montoFinalSistema ?? sesionAbierta.montoInicial;
      const nuevoSaldo = this.calcularNuevoSaldo(
        saldoActual,
        dto.tipo,
        dto.monto,
      );

      sesionAbierta.montoFinalSistema = nuevoSaldo;
      await this.repository.save(sesionAbierta);
    }

    return movimientoGuardado;
  }

  /**
   * CERRAR CAJA
   *
   * Cierra la sesión de caja actual.
   *
   * Validaciones:
   * - Debe existir una sesión ABIERTA
   *
   * Proceso:
   * 1. Buscar sesión abierta
   * 2. Calcular montoFinalSistema (suma SOLO efectivo)
   * 3. Calcular diferencia: montoRealEfectivo - montoFinalSistema
   * 4. Actualizar y cerrar sesión
   *
   * @param sesionId - ID de la sesión a cerrar
   * @param dto - Datos de cierre (montoRealEfectivo)
   * @returns Sesión cerrada
   * @throws NotFoundException si no existe la sesión
   * @throws BadRequestException si la sesión ya está cerrada
   */
  async cerrarCaja(
    sesionId: string,
    dto: CerrarCajaDto,
  ): Promise<SesionResponseDto> {
    // 1. Buscar sesión
    const sesion = await this.findOne(sesionId, { relations: ['movimientos'] });

    // 2. Validar que esté abierta
    if (sesion.estado === EstadoCaja.CERRADA) {
      throw new BadRequestException('La sesión de caja ya está cerrada');
    }

    // 3. Recalcular montoFinalSistema (solo EFECTIVO)
    const montoFinalSistema = await this.calcularMontoFinalSistema(sesion.id);

    // 4. Calcular diferencia
    const diferencia = dto.montoRealEfectivo - montoFinalSistema;

    // 5. Actualizar y cerrar sesión
    sesion.montoFinalSistema = montoFinalSistema;
    sesion.montoFinalReal = dto.montoRealEfectivo;
    sesion.diferencia = diferencia;
    sesion.estado = EstadoCaja.CERRADA;
    sesion.fechaCierre = new Date();

    const sesionCerrada = await this.repository.save(sesion);

    // ✅ Convertir a DTO para garantizar serialización correcta
    return SesionResponseDto.fromEntity(sesionCerrada);
  }

  /**
   * OBTENER MOVIMIENTOS DE UNA SESIÓN
   *
   * @param sesionId - ID de la sesión
   * @returns Lista de movimientos ordenados por fecha
   */
  async obtenerMovimientos(sesionId: string): Promise<MovimientoCaja[]> {
    // Verificar que la sesión pertenece al tenant
    await this.findOne(sesionId);

    return this.movimientoRepository.find({
      where: {
        sesionId,
        empresaId: this.empresaId,
      },
      order: {
        fecha: 'ASC',
      },
    });
  }

  /**
   * GENERAR REPORTE DIARIO
   *
   * Genera un reporte completo de caja para una fecha específica.
   *
   * Estructura del reporte:
   * - resumen: totalIngresos, totalEgresos, saldoFinal
   * - desglosePorMetodo: { efectivo, qr, transferencia, otro }
   * - movimientos: Lista cronológica completa
   *
   * @param fecha - Fecha del reporte (solo fecha, sin hora)
   * @returns Objeto con datos del reporte
   */
  async generarReporteDiario(fecha: Date): Promise<Record<string, unknown>> {
    // Convertir fecha a rango (inicio y fin del día)
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

    // Buscar sesiones del día
    const sesiones = await this.repository.find({
      where: this.buildTenantWhere({} as any),
      relations: ['usuario'],
    });

    const sesionesFiltradas = sesiones.filter(
      (s) => s.fechaApertura >= fechaInicio && s.fechaApertura <= fechaFin,
    );

    // Buscar movimientos del día
    const movimientos = await this.movimientoRepository
      .createQueryBuilder('movimiento')
      .where('movimiento.empresaId = :empresaId', {
        empresaId: this.empresaId,
      })
      .andWhere('movimiento.fecha >= :fechaInicio', { fechaInicio })
      .andWhere('movimiento.fecha <= :fechaFin', { fechaFin })
      .orderBy('movimiento.fecha', 'ASC')
      .getMany();

    // Calcular resumen
    const totalIngresos = movimientos
      .filter((m) => m.tipo === TipoMovimiento.INGRESO)
      .reduce((sum, m) => sum + m.monto, 0);

    const totalEgresos = movimientos
      .filter((m) => m.tipo === TipoMovimiento.EGRESO)
      .reduce((sum, m) => sum + m.monto, 0);

    const saldoFinal = totalIngresos - totalEgresos;

    // Desglose por método de pago
    const desglosePorMetodo = {
      EFECTIVO: this.calcularTotalPorMetodo(
        movimientos,
        MetodoPagoCaja.EFECTIVO,
      ),
      QR: this.calcularTotalPorMetodo(movimientos, MetodoPagoCaja.QR),
      TRANSFERENCIA: this.calcularTotalPorMetodo(
        movimientos,
        MetodoPagoCaja.TRANSFERENCIA,
      ),
      OTRO: this.calcularTotalPorMetodo(movimientos, MetodoPagoCaja.OTRO),
    };

    return {
      fecha: fecha.toISOString().split('T')[0],
      sesiones: sesionesFiltradas.map((s) => ({
        id: s.id,
        apertura: s.fechaApertura,
        cierre: s.fechaCierre,
        usuario: s.usuario?.nombre || 'N/A',
        montoInicial: s.montoInicial,
        montoFinalSistema: s.montoFinalSistema,
        montoFinalReal: s.montoFinalReal,
        diferencia: s.diferencia,
      })),
      resumen: {
        totalIngresos: parseFloat(totalIngresos.toFixed(2)),
        totalEgresos: parseFloat(totalEgresos.toFixed(2)),
        saldoFinal: parseFloat(saldoFinal.toFixed(2)),
      },
      desglosePorMetodo,
      movimientos: movimientos.map((m) => ({
        fecha: m.fecha,
        tipo: m.tipo,
        origen: m.origen,
        metodoPago: m.metodoPago,
        monto: m.monto,
        descripcion: m.descripcion,
      })),
    };
  }

  // ============ MÉTODOS PRIVADOS (HELPERS) ============

  /**
   * Calcula el nuevo saldo según el tipo de movimiento
   */
  private calcularNuevoSaldo(
    saldoActual: number,
    tipo: TipoMovimiento,
    monto: number,
  ): number {
    if (tipo === TipoMovimiento.INGRESO) {
      return saldoActual + monto;
    } else if (tipo === TipoMovimiento.EGRESO) {
      return saldoActual - monto;
    }
    return saldoActual;
  }

  /**
   * Calcula el monto final del sistema (solo EFECTIVO)
   */
  private async calcularMontoFinalSistema(sesionId: string): Promise<number> {
    const movimientos = await this.movimientoRepository.find({
      where: {
        sesionId,
        metodoPago: MetodoPagoCaja.EFECTIVO,
        empresaId: this.empresaId,
      },
    });

    let total = 0;

    movimientos.forEach((m) => {
      if (m.tipo === TipoMovimiento.INGRESO) {
        total += m.monto;
      } else if (m.tipo === TipoMovimiento.EGRESO) {
        total -= m.monto;
      }
    });

    return total;
  }

  /**
   * Calcula el total por método de pago
   */
  private calcularTotalPorMetodo(
    movimientos: MovimientoCaja[],
    metodo: MetodoPagoCaja,
  ): number {
    const total = movimientos
      .filter((m) => m.metodoPago === metodo)
      .reduce((sum, m) => {
        return m.tipo === TipoMovimiento.INGRESO
          ? sum + m.monto
          : sum - m.monto;
      }, 0);

    return parseFloat(total.toFixed(2));
  }
}
