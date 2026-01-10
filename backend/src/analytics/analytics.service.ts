import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comprobante } from '../ventas/entities/comprobante.entity';
import { Cobro } from '../ventas/entities/cobro.entity';
import { Tercero } from '../ventas/entities/tercero.entity';
import { Producto } from '../inventario/productos/entities/producto.entity';
import { TipoComprobante, EstadoPago, TipoTercero } from '../ventas/enums';
import {
  VentasMensualesResponseDto,
  VentaMensualDto,
  ComparativaMensualResponseDto,
  DatosMesDto,
  MetricasMesDto,
  VariacionesDto,
  CuentasPorCobrarResponseDto,
  ClienteMorosoDto,
  StockCriticoResponseDto,
  ProductoCriticoDto,
  CategoriaSimpleDto,
} from './dto';

/**
 * SERVICE: Analytics
 *
 * Servicio que proporciona métricas y analíticas para el dashboard.
 *
 * Características:
 * - Queries optimizadas con agregaciones en BD
 * - Aislamiento multi-tenant por empresaId
 * - Uso de índices existentes
 * - Manejo de casos edge (meses sin datos, división por cero)
 * - Redondeo a 2 decimales
 */
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Comprobante)
    private comprobanteRepo: Repository<Comprobante>,
    @InjectRepository(Cobro)
    private cobroRepo: Repository<Cobro>,
    @InjectRepository(Tercero)
    private terceroRepo: Repository<Tercero>,
    @InjectRepository(Producto)
    private productoRepo: Repository<Producto>,
  ) {}

  /**
   * Obtiene las ventas mensuales de los últimos N meses
   *
   * @param empresaId ID de la empresa (multi-tenant)
   * @param meses Cantidad de meses a consultar (default: 12)
   * @returns Datos de ventas mensuales con totales y promedios
   */
  async getVentasMensuales(
    empresaId: string,
    meses: number = 12,
  ): Promise<VentasMensualesResponseDto> {
    // Query optimizada con agregaciones en PostgreSQL
    const resultados = await this.comprobanteRepo
      .createQueryBuilder('c')
      .select("TO_CHAR(c.createdAt, 'YYYY-MM')", 'mes')
      .addSelect('SUM(c.total)', 'total')
      .addSelect('COUNT(*)', 'cantidad')
      .where('c.empresaId = :empresaId', { empresaId })
      .andWhere('c.tipo = :tipo', { tipo: TipoComprobante.VENTA })
      .andWhere('c.eliminado = false')
      .andWhere('c.createdAt >= :fechaInicio', {
        fechaInicio: new Date(
          new Date().setMonth(new Date().getMonth() - meses),
        ),
      })
      .groupBy('mes')
      .orderBy('mes', 'ASC')
      .getRawMany();

    // Rellenar meses sin ventas con 0
    const mesesCompletos = this.rellenarMesesFaltantes(resultados, meses);

    // Calcular totales
    const totalPeriodo = mesesCompletos.reduce(
      (sum, m) => sum + parseFloat(m.total || '0'),
      0,
    );
    const promedioMensual = meses > 0 ? totalPeriodo / meses : 0;

    return {
      meses: mesesCompletos.map((m) => ({
        mes: m.mes,
        mesNombre: this.formatearNombreMes(m.mes),
        total: parseFloat((parseFloat(m.total || '0')).toFixed(2)),
        cantidad: parseInt(m.cantidad || '0', 10),
        promedio:
          parseInt(m.cantidad || '0', 10) > 0
            ? parseFloat(
                (
                  parseFloat(m.total || '0') / parseInt(m.cantidad || '0', 10)
                ).toFixed(2),
              )
            : 0,
      })),
      totalPeriodo: parseFloat(totalPeriodo.toFixed(2)),
      promedioMensual: parseFloat(promedioMensual.toFixed(2)),
    };
  }

  /**
   * Obtiene la comparativa entre el mes actual y el mes anterior
   *
   * @param empresaId ID de la empresa (multi-tenant)
   * @param mes Mes a consultar en formato YYYY-MM (default: mes actual)
   * @returns Comparativa con variaciones porcentuales
   */
  async getComparativaMensual(
    empresaId: string,
    mes?: string,
  ): Promise<ComparativaMensualResponseDto> {
    const mesActual = mes || this.getMesActual();
    const mesAnterior = this.getMesAnterior(mesActual);

    // Obtener métricas de ambos meses en paralelo
    const [metricasActual, metricasAnterior] = await Promise.all([
      this.getMetricasMes(empresaId, mesActual),
      this.getMetricasMes(empresaId, mesAnterior),
    ]);

    // Calcular variaciones porcentuales
    const variaciones = this.calcularVariaciones(
      metricasActual,
      metricasAnterior,
    );

    return {
      mesActual: {
        mes: mesActual,
        mesNombre: this.formatearNombreMes(mesActual),
        metricas: metricasActual,
      },
      mesAnterior: {
        mes: mesAnterior,
        mesNombre: this.formatearNombreMes(mesAnterior),
        metricas: metricasAnterior,
      },
      variaciones,
    };
  }

  /**
   * Obtiene las cuentas por cobrar (clientes morosos)
   *
   * @param empresaId ID de la empresa (multi-tenant)
   * @param limit Cantidad de clientes a retornar (default: 10)
   * @param incluirTodos Si es true, retorna todos los clientes con deuda
   * @returns Listado de clientes morosos con totales
   */
  async getCuentasPorCobrar(
    empresaId: string,
    limit: number = 10,
    incluirTodos: boolean = false,
  ): Promise<CuentasPorCobrarResponseDto> {
    // Query optimizada usando el cache saldoActual de Tercero
    const clientesConDeuda = await this.terceroRepo
      .createQueryBuilder('t')
      .select('t.id', 'clienteId')
      .addSelect('t.nombre', 'clienteNombre')
      .addSelect('t.saldoActual', 'saldoTotal')
      .addSelect('COUNT(c.id)', 'cantidadComprobantes')
      .addSelect('MIN(c.createdAt)', 'comprobanteMasAntiguo')
      .leftJoin(
        'comprobante',
        'c',
        'c.terceroId = t.id AND c.saldoPendiente > 0 AND c.eliminado = false',
      )
      .where('t.empresaId = :empresaId', { empresaId })
      .andWhere('t.tipo = :tipo', { tipo: TipoTercero.CLIENTE })
      .andWhere('t.saldoActual > 0')
      .andWhere('t.eliminado = false')
      .groupBy('t.id')
      .addGroupBy('t.nombre')
      .addGroupBy('t.saldoActual')
      .orderBy('t.saldoActual', 'DESC')
      .limit(incluirTodos ? undefined : limit)
      .getRawMany();

    // Calcular días de vencimiento
    const clientesMorosos: ClienteMorosoDto[] = clientesConDeuda.map((c) => ({
      clienteId: c.clienteId,
      clienteNombre: c.clienteNombre,
      saldoTotal: parseFloat(parseFloat(c.saldoTotal).toFixed(2)),
      cantidadComprobantes: parseInt(c.cantidadComprobantes, 10),
      comprobanteMasAntiguo: c.comprobanteMasAntiguo
        ? new Date(c.comprobanteMasAntiguo).toISOString()
        : new Date().toISOString(),
      diasVencimiento: c.comprobanteMasAntiguo
        ? Math.floor(
            (Date.now() - new Date(c.comprobanteMasAntiguo).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0,
    }));

    // Calcular totales
    const totalGeneral = clientesMorosos.reduce(
      (sum, c) => sum + c.saldoTotal,
      0,
    );
    const cantidadClientes = clientesMorosos.length;
    const promedioDeuda =
      cantidadClientes > 0 ? totalGeneral / cantidadClientes : 0;

    return {
      totalGeneral: parseFloat(totalGeneral.toFixed(2)),
      cantidadClientes,
      clientesMorosos,
      promedioDeuda: parseFloat(promedioDeuda.toFixed(2)),
    };
  }

  /**
   * Obtiene los productos con stock crítico
   *
   * @param empresaId ID de la empresa (multi-tenant)
   * @param limit Cantidad de productos a retornar (default: 20)
   * @param ordenarPor Criterio de ordenamiento (default: 'deficit')
   * @returns Listado de productos con stock bajo mínimo
   */
  async getStockCritico(
    empresaId: string,
    limit: number = 20,
    ordenarPor: 'deficit' | 'alfabetico' = 'deficit',
  ): Promise<StockCriticoResponseDto> {
    // Query optimizada con JOIN a categoría
    const queryBuilder = this.productoRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'cat')
      .where('p.empresaId = :empresaId', { empresaId })
      .andWhere('p.stockActual <= p.stockMinimo')
      .andWhere('p.eliminado = false')
      .limit(limit);

    // Aplicar ordenamiento
    if (ordenarPor === 'deficit') {
      queryBuilder.orderBy('(p.stockMinimo - p.stockActual)', 'DESC');
    } else {
      queryBuilder.orderBy('p.nombre', 'ASC');
    }

    const productos = await queryBuilder.getMany();

    // Mapear a DTO
    const productosCriticos: ProductoCriticoDto[] = productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigoBarras: p.codigoBarras,
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      deficit: p.stockMinimo - p.stockActual,
      categoria: p.categoria
        ? {
            id: p.categoria.id,
            nombre: p.categoria.nombre,
          }
        : null,
    }));

    // Calcular totales
    const totalProductosCriticos = productosCriticos.length;
    const totalDeficit = productosCriticos.reduce(
      (sum, p) => sum + p.deficit,
      0,
    );

    return {
      productos: productosCriticos,
      totalProductosCriticos,
      totalDeficit,
    };
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtiene las métricas de un mes específico
   */
  private async getMetricasMes(
    empresaId: string,
    mes: string,
  ): Promise<MetricasMesDto> {
    // Calcular rango de fechas del mes
    const [year, month] = mes.split('-').map(Number);
    const fechaInicio = new Date(year, month - 1, 1);
    const fechaFin = new Date(year, month, 0, 23, 59, 59);

    // Query para ventas del mes
    const ventasData = await this.comprobanteRepo
      .createQueryBuilder('c')
      .select('SUM(c.total)', 'totalVentas')
      .addSelect('COUNT(*)', 'cantidadVentas')
      .addSelect('SUM(c.saldoPendiente)', 'totalPendiente')
      .where('c.empresaId = :empresaId', { empresaId })
      .andWhere('c.tipo = :tipo', { tipo: TipoComprobante.VENTA })
      .andWhere('c.eliminado = false')
      .andWhere('c.createdAt >= :fechaInicio', { fechaInicio })
      .andWhere('c.createdAt <= :fechaFin', { fechaFin })
      .getRawOne();

    // Query para cobros del mes
    const cobrosData = await this.cobroRepo
      .createQueryBuilder('co')
      .select('SUM(co.monto)', 'totalCobrado')
      .leftJoin('co.comprobante', 'c')
      .where('c.empresaId = :empresaId', { empresaId })
      .andWhere('c.tipo = :tipo', { tipo: TipoComprobante.VENTA })
      .andWhere('co.fecha >= :fechaInicio', { fechaInicio })
      .andWhere('co.fecha <= :fechaFin', { fechaFin })
      .getRawOne();

    const totalVentas = parseFloat(ventasData?.totalVentas || '0');
    const cantidadVentas = parseInt(ventasData?.cantidadVentas || '0', 10);
    const totalPendiente = parseFloat(ventasData?.totalPendiente || '0');
    const totalCobrado = parseFloat(cobrosData?.totalCobrado || '0');
    const ticketPromedio =
      cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    return {
      totalVentas: parseFloat(totalVentas.toFixed(2)),
      cantidadVentas,
      ticketPromedio: parseFloat(ticketPromedio.toFixed(2)),
      totalCobrado: parseFloat(totalCobrado.toFixed(2)),
      totalPendiente: parseFloat(totalPendiente.toFixed(2)),
    };
  }

  /**
   * Calcula las variaciones porcentuales entre dos períodos
   */
  private calcularVariaciones(
    actual: MetricasMesDto,
    anterior: MetricasMesDto,
  ): VariacionesDto {
    const calcularVariacion = (actual: number, anterior: number): number => {
      if (anterior === 0) return actual > 0 ? 100 : 0;
      return parseFloat((((actual - anterior) / anterior) * 100).toFixed(2));
    };

    return {
      totalVentas: calcularVariacion(actual.totalVentas, anterior.totalVentas),
      cantidadVentas: calcularVariacion(
        actual.cantidadVentas,
        anterior.cantidadVentas,
      ),
      ticketPromedio: calcularVariacion(
        actual.ticketPromedio,
        anterior.ticketPromedio,
      ),
      totalCobrado: calcularVariacion(
        actual.totalCobrado,
        anterior.totalCobrado,
      ),
    };
  }

  /**
   * Rellena los meses faltantes con datos en 0
   */
  private rellenarMesesFaltantes(
    resultados: any[],
    cantidadMeses: number,
  ): any[] {
    const mesesCompletos: any[] = [];
    const hoy = new Date();

    for (let i = cantidadMeses - 1; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      const resultado = resultados.find((r) => r.mes === mesKey);
      mesesCompletos.push(
        resultado || { mes: mesKey, total: '0', cantidad: '0' },
      );
    }

    return mesesCompletos;
  }

  /**
   * Obtiene el mes actual en formato YYYY-MM
   */
  private getMesActual(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Obtiene el mes anterior en formato YYYY-MM
   */
  private getMesAnterior(mes: string): string {
    const [year, month] = mes.split('-').map(Number);
    const fecha = new Date(year, month - 2, 1); // month - 2 porque getMonth() es 0-indexed
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Formatea el nombre del mes para mostrar
   */
  private formatearNombreMes(mes: string): string {
    const [year, month] = mes.split('-').map(Number);
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return `${meses[month - 1]} ${year}`;
  }
}
