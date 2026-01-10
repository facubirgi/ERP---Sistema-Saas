import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AnalyticsService } from './analytics.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import {
  VentasMensualesResponseDto,
  ComparativaMensualResponseDto,
  CuentasPorCobrarResponseDto,
  StockCriticoResponseDto,
} from './dto';

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

/**
 * CONTROLLER: Analytics
 *
 * Gestiona los endpoints REST para analíticas y métricas del dashboard.
 *
 * Endpoints:
 * - GET /analytics/ventas-mensuales: Ventas de los últimos N meses
 * - GET /analytics/comparativa-mensual: Comparación mes actual vs anterior
 * - GET /analytics/cuentas-por-cobrar: Listado de clientes morosos
 * - GET /analytics/stock-critico: Productos con stock bajo mínimo
 *
 * Seguridad:
 * - Todos los endpoints requieren autenticación JWT
 * - Aislamiento multi-tenant por empresaId
 * - Guards: JwtAuthGuard + TenantGuard
 *
 * Performance:
 * - Queries optimizadas con agregaciones en BD
 * - Objetivo: < 500ms por endpoint
 */
@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/ventas-mensuales
   *
   * Obtiene las ventas mensuales de los últimos N meses.
   * Incluye totales, cantidades y promedios por mes.
   *
   * @param meses Cantidad de meses a consultar (1-24, default: 12)
   * @param req Request object con datos del usuario autenticado
   * @returns Datos de ventas mensuales con totales y promedios
   */
  @Get('ventas-mensuales')
  @ApiOperation({
    summary: 'Obtener ventas mensuales',
    description:
      'Retorna las ventas de los últimos N meses con totales agregados y promedios.',
  })
  @ApiQuery({
    name: 'meses',
    required: false,
    type: Number,
    description: 'Cantidad de meses a consultar (1-24)',
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'Ventas mensuales obtenidas exitosamente',
    type: VentasMensualesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros inválidos',
  })
  async getVentasMensuales(
    @Request() req: RequestWithUser,
    @Query('meses', new ParseIntPipe({ optional: true })) meses?: number,
  ): Promise<VentasMensualesResponseDto> {
    const empresaId = req.user.empresaId;
    const mesesValidos = this.validarMeses(meses || 12);

    return this.analyticsService.getVentasMensuales(empresaId, mesesValidos);
  }

  /**
   * GET /analytics/comparativa-mensual
   *
   * Compara las métricas del mes actual con el mes anterior.
   * Incluye variaciones porcentuales.
   *
   * @param mes Mes a consultar en formato YYYY-MM (default: mes actual)
   * @param req Request object con datos del usuario autenticado
   * @returns Comparativa con variaciones porcentuales
   */
  @Get('comparativa-mensual')
  @ApiOperation({
    summary: 'Obtener comparativa mensual',
    description:
      'Compara el mes actual con el mes anterior, mostrando variaciones porcentuales.',
  })
  @ApiQuery({
    name: 'mes',
    required: false,
    type: String,
    description: 'Mes a consultar en formato YYYY-MM',
    example: '2026-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Comparativa mensual obtenida exitosamente',
    type: ComparativaMensualResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Formato de mes inválido',
  })
  async getComparativaMensual(
    @Request() req: RequestWithUser,
    @Query('mes') mes?: string,
  ): Promise<ComparativaMensualResponseDto> {
    const empresaId = req.user.empresaId;

    // Validar formato de mes si se proporciona
    if (mes && !this.validarFormatoMes(mes)) {
      throw new BadRequestException(
        'Formato de mes inválido. Use YYYY-MM (ej: 2026-01)',
      );
    }

    return this.analyticsService.getComparativaMensual(empresaId, mes);
  }

  /**
   * GET /analytics/cuentas-por-cobrar
   *
   * Obtiene el listado de clientes con deuda pendiente.
   * Incluye totales generales y detalle por cliente.
   *
   * @param limit Cantidad de clientes a retornar (1-100, default: 10)
   * @param incluirTodos Si es true, retorna todos los clientes con deuda
   * @param req Request object con datos del usuario autenticado
   * @returns Listado de clientes morosos con totales
   */
  @Get('cuentas-por-cobrar')
  @ApiOperation({
    summary: 'Obtener cuentas por cobrar',
    description:
      'Retorna el listado de clientes con deuda pendiente ordenados por saldo.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de clientes a retornar (1-100)',
    example: 10,
  })
  @ApiQuery({
    name: 'incluirTodos',
    required: false,
    type: Boolean,
    description: 'Si es true, retorna todos los clientes con deuda',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Cuentas por cobrar obtenidas exitosamente',
    type: CuentasPorCobrarResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros inválidos',
  })
  async getCuentasPorCobrar(
    @Request() req: RequestWithUser,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('incluirTodos') incluirTodos?: string,
  ): Promise<CuentasPorCobrarResponseDto> {
    const empresaId = req.user.empresaId;
    const limitValido = this.validarLimit(limit || 10);
    const incluirTodosBool = incluirTodos === 'true';

    return this.analyticsService.getCuentasPorCobrar(
      empresaId,
      limitValido,
      incluirTodosBool,
    );
  }

  /**
   * GET /analytics/stock-critico
   *
   * Obtiene los productos con stock menor o igual al stock mínimo.
   * Incluye información de categoría y déficit.
   *
   * @param limit Cantidad de productos a retornar (1-100, default: 20)
   * @param ordenarPor Criterio de ordenamiento: 'deficit' o 'alfabetico'
   * @param req Request object con datos del usuario autenticado
   * @returns Listado de productos con stock crítico
   */
  @Get('stock-critico')
  @ApiOperation({
    summary: 'Obtener stock crítico',
    description:
      'Retorna los productos con stock menor o igual al stock mínimo.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de productos a retornar (1-100)',
    example: 20,
  })
  @ApiQuery({
    name: 'ordenarPor',
    required: false,
    enum: ['deficit', 'alfabetico'],
    description: 'Criterio de ordenamiento',
    example: 'deficit',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock crítico obtenido exitosamente',
    type: StockCriticoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros inválidos',
  })
  async getStockCritico(
    @Request() req: RequestWithUser,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('ordenarPor') ordenarPor?: 'deficit' | 'alfabetico',
  ): Promise<StockCriticoResponseDto> {
    const empresaId = req.user.empresaId;
    const limitValido = this.validarLimit(limit || 20);
    const ordenValido =
      ordenarPor === 'alfabetico' ? 'alfabetico' : 'deficit';

    return this.analyticsService.getStockCritico(
      empresaId,
      limitValido,
      ordenValido,
    );
  }

  // ==================== MÉTODOS DE VALIDACIÓN ====================

  /**
   * Valida que la cantidad de meses esté en el rango permitido
   */
  private validarMeses(meses: number): number {
    if (meses < 1 || meses > 24) {
      throw new BadRequestException(
        'La cantidad de meses debe estar entre 1 y 24',
      );
    }
    return meses;
  }

  /**
   * Valida que el límite esté en el rango permitido
   */
  private validarLimit(limit: number): number {
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('El límite debe estar entre 1 y 100');
    }
    return limit;
  }

  /**
   * Valida que el formato del mes sea YYYY-MM
   */
  private validarFormatoMes(mes: string): boolean {
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(mes)) return false;

    const [year, month] = mes.split('-').map(Number);
    return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
  }
}
