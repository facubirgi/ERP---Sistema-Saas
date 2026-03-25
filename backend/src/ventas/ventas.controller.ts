import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { VentasService } from './ventas.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
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
} from './dto';

/**
 * CONTROLLER: Ventas y Cobros
 *
 * Gestiona los endpoints REST para el módulo de ventas y cobros.
 *
 * Endpoints:
 * - POST /ventas: Registrar una nueva venta
 * - GET /ventas: Listar todas las ventas con filtros opcionales
 * - PATCH /ventas/:id: Actualizar un comprobante
 * - POST /ventas/cobros: Registrar un cobro diferido
 * - GET /ventas/cobros/export: Exportar cobros de sesión de caja actual
 * - PATCH /ventas/cobros/:id: Actualizar un cobro
 * - GET /ventas/deudas/:clienteId: Obtener cuenta corriente de un cliente
 * - GET /ventas/:id: Obtener detalle completo de una venta
 *
 * Integración con Caja:
 * - Los cobros se registran automáticamente como movimientos de caja
 * - Endpoint de exportación requiere sesión de caja abierta
 *
 * Seguridad:
 * - Todos los endpoints requieren autenticación JWT
 * - El empresaId se extrae automáticamente del token JWT
 */
@Controller('ventas')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Ventas y Cobros')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  /**
   * POST /ventas
   *
   * Registra una nueva venta con cobro inicial (total o parcial).
   *
   * Reglas de negocio:
   * - Ventas anónimas (sin clienteId) deben pagarse completas
   * - Ventas con cliente identificado pueden tener saldo pendiente
   * - Si montoPagado > 0, se debe especificar metodoPago
   *
   * @param crearVentaDto Datos de la venta
   * @param req Request object con datos del usuario autenticado
   * @returns Respuesta con comprobante, cobro y mensaje
   */
  @Post()
  @ApiOperation({
    summary: 'Registrar una nueva venta',
    description:
      'Crea una venta con cobro inicial (total o parcial). Permite ventas anónimas si se paga completo.',
  })
  @ApiResponse({
    status: 201,
    description: 'Venta registrada exitosamente',
    type: VentaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validación fallida o regla de negocio violada',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  async crearVenta(
    @Body() crearVentaDto: CrearVentaDto,
    @Request() req: RequestWithUser,
  ): Promise<VentaResponseDto> {
    const { empresaId, userId } = req.user;
    return this.ventasService.crearVenta(crearVentaDto, empresaId, userId);
  }

  /**
   * GET /ventas
   *
   * Lista todas las ventas con filtros opcionales.
   *
   * Query Parameters opcionales:
   * - estadoPago: Filtrar por estado (PENDIENTE, PARCIAL, PAGADO)
   * - clienteId: Filtrar por cliente específico
   * - fechaDesde: Filtrar ventas desde esta fecha (YYYY-MM-DD)
   * - fechaHasta: Filtrar ventas hasta esta fecha (YYYY-MM-DD)
   *
   * Ordenamiento: Por fecha de creación (DESC) - más recientes primero
   *
   * IMPORTANTE: Este endpoint debe estar ANTES de GET /ventas/:id
   * para evitar que los query params sean interpretados como rutas.
   * Sin embargo, en NestJS las rutas más específicas tienen prioridad,
   * así que GET /ventas/deudas/:clienteId y GET /ventas/cobros se evalúan primero.
   *
   * @param query Parámetros de filtro
   * @param req Request object con datos del usuario autenticado
   * @returns Lista de ventas con información resumida
   */
  @Get()
  @ApiOperation({
    summary: 'Listar todas las ventas',
    description:
      'Obtiene un listado de ventas con filtros opcionales: estado de pago, cliente, y rango de fechas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ventas',
    type: [VentaListItemDto],
  })
  async listarVentas(
    @Query() query: ListarVentasQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<VentaListItemDto[]> {
    return this.ventasService.listarVentas(query, req.user.empresaId);
  }

  /**
   * POST /ventas/cobros
   *
   * Registra un cobro diferido sobre una venta con saldo pendiente.
   *
   * Validaciones:
   * - El comprobante debe existir y pertenecer a la empresa
   * - El comprobante no debe estar completamente pagado
   * - El monto no debe exceder el saldo pendiente
   *
   * @param registrarCobroDto Datos del cobro
   * @param req Request object con datos del usuario autenticado
   * @returns Respuesta con cobro, estado del comprobante y mensaje
   */
  @Post('cobros')
  @ApiOperation({
    summary: 'Registrar un cobro diferido',
    description:
      'Registra un nuevo cobro sobre una venta previamente creada con saldo pendiente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Cobro registrado exitosamente',
    type: CobroResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Monto excede saldo pendiente o comprobante ya pagado',
  })
  @ApiResponse({
    status: 404,
    description: 'Comprobante no encontrado',
  })
  async registrarCobro(
    @Body() registrarCobroDto: RegistrarCobroDto,
    @Request() req: RequestWithUser,
  ): Promise<CobroResponseDto> {
    const empresaId = req.user.empresaId;
    return this.ventasService.registrarNuevoCobro(registrarCobroDto, empresaId);
  }

  /**
   * GET /ventas/cobros/export
   *
   * Exporta todos los cobros realizados durante la sesión de caja actual.
   * Incluye resumen por método de pago y totales.
   *
   * Casos de uso:
   * - Generar reporte de cobros del día
   * - Verificar estado financiero en tiempo real
   * - Preparar datos para arqueo de caja
   * - Exportar a Excel o CSV desde el frontend
   *
   * Validaciones:
   * - Debe existir una sesión de caja ABIERTA
   *
   * IMPORTANTE: Este endpoint debe estar ANTES de PATCH /ventas/cobros/:id
   * para que "export" no sea interpretado como un ID.
   *
   * @param req Request object con datos del usuario autenticado
   * @returns Datos completos de cobros para exportación con resumen
   */
  @Get('cobros/export')
  @ApiOperation({
    summary: 'Exportar cobros de sesión de caja actual',
    description:
      'Obtiene todos los cobros realizados durante la sesión de caja activa con resumen por método de pago. Requiere caja abierta.',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos de exportación de cobros',
    type: ExportarCobrosResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No hay sesión de caja abierta',
  })
  async exportarCobros(
    @Request() req: RequestWithUser,
  ): Promise<ExportarCobrosResponseDto> {
    const empresaId = req.user.empresaId;
    return this.ventasService.listarCobrosParaExportar(empresaId);
  }

  /**
   * PATCH /ventas/cobros/:id
   *
   * Actualiza el método de pago y/o la fecha de un cobro existente.
   *
   * Casos de uso:
   * - Corregir el método de pago capturado incorrectamente
   * - Ajustar la fecha del cobro
   *
   * Validaciones:
   * - NO se puede actualizar el monto (esto requeriría recalcular saldos)
   *
   * IMPORTANTE: Este endpoint debe estar ANTES de PATCH /ventas/:id
   * para que las rutas se evalúen correctamente.
   *
   * @param id ID del cobro
   * @param dto Datos a actualizar
   * @param req Request object con datos del usuario autenticado
   * @returns Cobro actualizado
   */
  @Patch('cobros/:id')
  @ApiOperation({
    summary: 'Actualizar un cobro',
    description:
      'Permite actualizar el método de pago y la fecha de un cobro. No se puede modificar el monto.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cobro actualizado exitosamente',
    type: CobroResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cobro no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Validación fallida',
  })
  async actualizarCobro(
    @Param('id') id: string,
    @Body() dto: ActualizarCobroDto,
    @Request() req: RequestWithUser,
  ): Promise<CobroResponseDto> {
    return this.ventasService.actualizarCobro(id, dto, req.user.empresaId);
  }

  /**
   * PATCH /ventas/:id
   *
   * Actualiza el tercero asociado a un comprobante (venta).
   *
   * Casos de uso:
   * - Asignar un cliente a una venta anónima
   * - Cambiar el cliente de una venta
   * - Convertir una venta de cliente a anónima (terceroId = null)
   *
   * Validaciones:
   * - Solo se puede cambiar si no hay saldo pendiente
   *
   * IMPORTANTE: Este endpoint debe estar ANTES de GET /ventas/:id
   * para que las rutas se evalúen correctamente.
   *
   * @param id ID del comprobante
   * @param dto Datos a actualizar
   * @param req Request object con datos del usuario autenticado
   * @returns Comprobante actualizado con detalles completos
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un comprobante',
    description:
      'Permite cambiar el cliente asociado a una venta. Solo disponible si no hay saldo pendiente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comprobante actualizado exitosamente',
    type: DetalleVentaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'No se puede actualizar: comprobante con saldo pendiente o validación fallida',
  })
  @ApiResponse({
    status: 404,
    description: 'Comprobante o cliente no encontrado',
  })
  async actualizarComprobante(
    @Param('id') id: string,
    @Body() dto: ActualizarComprobanteDto,
    @Request() req: RequestWithUser,
  ): Promise<DetalleVentaResponseDto> {
    return this.ventasService.actualizarComprobante(
      id,
      dto,
      req.user.empresaId,
    );
  }

  /**
   * GET /ventas/deudas/:clienteId
   *
   * Obtiene la cuenta corriente de un cliente.
   * Retorna todas las ventas con saldo pendiente (PENDIENTE o PARCIAL).
   *
   * IMPORTANTE: Este endpoint debe estar ANTES de GET /ventas/:id
   * para evitar que "deudas" sea interpretado como un ID.
   *
   * @param clienteId ID del cliente
   * @param req Request object con datos del usuario autenticado
   * @returns Lista de comprobantes con deuda pendiente
   */
  @Get('deudas/:clienteId')
  @ApiOperation({
    summary: 'Obtener cuenta corriente de un cliente',
    description:
      'Retorna todas las ventas con saldo pendiente de un cliente específico',
  })
  @ApiResponse({
    status: 200,
    type: [DeudaClienteDto],
    description: 'Lista de deudas del cliente',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  async getDeudasCliente(
    @Param('clienteId') clienteId: string,
    @Request() req: RequestWithUser,
  ): Promise<DeudaClienteDto[]> {
    return this.ventasService.getDeudasCliente(clienteId, req.user.empresaId);
  }

  /**
   * GET /ventas/:id
   *
   * Obtiene el detalle completo de una venta.
   * Incluye información del comprobante, cliente, items vendidos e historial de cobros.
   *
   * @param id ID del comprobante
   * @param req Request object con datos del usuario autenticado
   * @returns Detalle completo de la venta
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle completo de una venta',
    description:
      'Retorna el comprobante con cliente, items vendidos e historial de cobros',
  })
  @ApiResponse({
    status: 200,
    type: DetalleVentaResponseDto,
    description: 'Detalle de la venta',
  })
  @ApiResponse({
    status: 404,
    description: 'Comprobante no encontrado',
  })
  async getDetalleVenta(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<DetalleVentaResponseDto> {
    return this.ventasService.getDetalleVenta(id, req.user.empresaId);
  }
}
