import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CajaService } from './caja.service';
import { AbrirCajaDto, CerrarCajaDto, CrearMovimientoDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

/**
 * CONTROLLER DE CAJA (TESORERÍA)
 *
 * Endpoints:
 * - POST   /api/caja/abrir                → Abrir sesión de caja
 * - GET    /api/caja/sesion-actual        → Obtener sesión abierta actual
 * - POST   /api/caja/:id/cerrar           → Cerrar sesión de caja
 * - POST   /api/caja/movimientos          → Registrar movimiento en sesión actual
 * - GET    /api/caja/:id/movimientos      → Listar movimientos de una sesión
 * - GET    /api/caja                      → Listar sesiones (historial)
 * - GET    /api/caja/reporte/diario       → Generar reporte diario
 * - GET    /api/caja/:id                  → Obtener sesión por ID
 */
@ApiTags('Caja')
@Controller('caja')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  /**
   * ABRIR CAJA
   */
  @Post('abrir')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abrir sesión de caja',
    description:
      'Abre una nueva sesión de caja con un monto inicial. Solo puede haber una sesión abierta por empresa.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sesión de caja abierta exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fechaApertura: '2025-11-25T08:00:00.000Z',
        montoInicial: 1000.0,
        montoFinalSistema: 1000.0,
        estado: 'ABIERTA',
        usuarioId: '987e6543-e21b-12d3-a456-426614174000',
        empresaId: '456e7890-e21b-12d3-a456-426614174000',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Ya existe una sesión abierta',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async abrirCaja(@Body() abrirCajaDto: AbrirCajaDto) {
    return this.cajaService.abrirCaja(abrirCajaDto);
  }

  /**
   * OBTENER SESIÓN ACTUAL
   */
  @Get('sesion-actual')
  @ApiOperation({
    summary: 'Obtener sesión de caja actual',
    description:
      'Retorna la sesión de caja que está actualmente abierta, o null si no hay ninguna.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión actual encontrada o null',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fechaApertura: '2025-11-25T08:00:00.000Z',
        montoInicial: 1000.0,
        montoFinalSistema: 1250.5,
        estado: 'ABIERTA',
        usuario: {
          id: '987e6543-e21b-12d3-a456-426614174000',
          nombre: 'Juan Pérez',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async obtenerSesionActual() {
    return this.cajaService.obtenerSesionActual();
  }

  /**
   * CERRAR CAJA
   */
  @Post(':id/cerrar')
  @ApiOperation({
    summary: 'Cerrar sesión de caja',
    description:
      'Cierra una sesión de caja realizando el arqueo. Calcula la diferencia entre el monto real y el sistema.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la sesión de caja',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fechaApertura: '2025-11-25T08:00:00.000Z',
        fechaCierre: '2025-11-25T18:00:00.000Z',
        montoInicial: 1000.0,
        montoFinalSistema: 1250.5,
        montoFinalReal: 1245.0,
        diferencia: -5.5,
        estado: 'CERRADA',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'La sesión ya está cerrada',
  })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  async cerrarCaja(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cerrarCajaDto: CerrarCajaDto,
  ) {
    return this.cajaService.cerrarCaja(id, cerrarCajaDto);
  }

  /**
   * REGISTRAR MOVIMIENTO
   */
  @Post('movimientos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar movimiento de caja',
    description:
      'Registra un nuevo movimiento (ingreso o egreso) en la sesión de caja actual. Actualiza el saldo si es efectivo.',
  })
  @ApiResponse({
    status: 201,
    description: 'Movimiento registrado exitosamente',
    schema: {
      example: {
        id: '789e0123-e89b-12d3-a456-426614174000',
        sesionId: '123e4567-e89b-12d3-a456-426614174000',
        fecha: '2025-11-25T10:30:00.000Z',
        tipo: 'INGRESO',
        origen: 'VENTA',
        metodoPago: 'EFECTIVO',
        monto: 150.5,
        descripcion: 'Cobro venta #12345',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No hay sesión de caja abierta',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async registrarMovimiento(@Body() crearMovimientoDto: CrearMovimientoDto) {
    return this.cajaService.registrarMovimiento(crearMovimientoDto);
  }

  /**
   * OBTENER MOVIMIENTOS DE UNA SESIÓN
   */
  @Get(':id/movimientos')
  @ApiOperation({
    summary: 'Listar movimientos de una sesión',
    description:
      'Retorna todos los movimientos de una sesión de caja específica, ordenados cronológicamente.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la sesión de caja',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimientos',
    schema: {
      example: [
        {
          id: '789e0123-e89b-12d3-a456-426614174000',
          fecha: '2025-11-25T08:00:00.000Z',
          tipo: 'INGRESO',
          origen: 'APERTURA',
          metodoPago: 'EFECTIVO',
          monto: 1000.0,
          descripcion: 'Apertura de caja con monto inicial de 1000',
        },
        {
          id: '456e7890-e89b-12d3-a456-426614174000',
          fecha: '2025-11-25T10:30:00.000Z',
          tipo: 'INGRESO',
          origen: 'VENTA',
          metodoPago: 'EFECTIVO',
          monto: 150.5,
          descripcion: 'Cobro venta #12345',
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  async obtenerMovimientos(@Param('id', ParseUUIDPipe) id: string) {
    return this.cajaService.obtenerMovimientos(id);
  }

  /**
   * LISTAR SESIONES (HISTORIAL)
   */
  @Get()
  @ApiOperation({
    summary: 'Listar todas las sesiones de caja',
    description:
      'Retorna el historial de sesiones de caja de la empresa (abiertas y cerradas).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de sesiones',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          fechaApertura: '2025-11-25T08:00:00.000Z',
          fechaCierre: '2025-11-25T18:00:00.000Z',
          montoInicial: 1000.0,
          montoFinalSistema: 1250.5,
          montoFinalReal: 1245.0,
          diferencia: -5.5,
          estado: 'CERRADA',
        },
        {
          id: '987e6543-e21b-12d3-a456-426614174000',
          fechaApertura: '2025-11-24T08:00:00.000Z',
          fechaCierre: '2025-11-24T18:00:00.000Z',
          montoInicial: 1000.0,
          montoFinalSistema: 2150.0,
          montoFinalReal: 2150.0,
          diferencia: 0.0,
          estado: 'CERRADA',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findAll() {
    return this.cajaService.findAll({ order: { fechaApertura: 'DESC' } });
  }

  /**
   * OBTENER SESIÓN POR ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener sesión de caja por ID',
    description: 'Retorna los detalles de una sesión de caja específica.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la sesión de caja',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión encontrada',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fechaApertura: '2025-11-25T08:00:00.000Z',
        fechaCierre: '2025-11-25T18:00:00.000Z',
        montoInicial: 1000.0,
        montoFinalSistema: 1250.5,
        montoFinalReal: 1245.0,
        diferencia: -5.5,
        estado: 'CERRADA',
        usuario: {
          id: '987e6543-e21b-12d3-a456-426614174000',
          nombre: 'Juan Pérez',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cajaService.findOne(id, { relations: ['usuario'] });
  }

  /**
   * GENERAR REPORTE DIARIO
   */
  @Get('reporte/diario')
  @ApiOperation({
    summary: 'Generar reporte diario de caja',
    description:
      'Genera un reporte completo de todas las sesiones y movimientos de un día específico.',
  })
  @ApiQuery({
    name: 'fecha',
    required: true,
    type: String,
    description: 'Fecha del reporte en formato YYYY-MM-DD',
    example: '2025-11-25',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte generado exitosamente',
    schema: {
      example: {
        fecha: '2025-11-25',
        sesiones: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            apertura: '2025-11-25T08:00:00.000Z',
            cierre: '2025-11-25T18:00:00.000Z',
            usuario: 'Juan Pérez',
            montoInicial: 1000.0,
            montoFinalSistema: 1250.5,
            montoFinalReal: 1245.0,
            diferencia: -5.5,
          },
        ],
        resumen: {
          totalIngresos: 2500.5,
          totalEgresos: 300.0,
          saldoFinal: 2200.5,
        },
        desglosePorMetodo: {
          EFECTIVO: 1500.0,
          QR: 700.5,
          TRANSFERENCIA: 300.0,
          OTRO: 0.0,
        },
        movimientos: [
          {
            fecha: '2025-11-25T08:00:00.000Z',
            tipo: 'INGRESO',
            origen: 'APERTURA',
            metodoPago: 'EFECTIVO',
            monto: 1000.0,
            descripcion: 'Apertura de caja',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Fecha inválida',
  })
  async generarReporteDiario(
    @Query('fecha') fecha: string,
  ): Promise<Record<string, unknown>> {
    const fechaReporte = new Date(fecha);
    return this.cajaService.generarReporteDiario(fechaReporte);
  }
}
