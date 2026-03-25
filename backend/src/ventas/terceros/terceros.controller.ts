import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioRol } from '../../tenant/entities/usuario.entity';
import { TercerosService } from './terceros.service';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
import {
  SaldoTerceroResponseDto,
  CrearTerceroDto,
  ActualizarTerceroDto,
  TerceroResponseDto,
  ListarTercerosQueryDto,
} from './dto';

/**
 * CONTROLLER: Terceros
 *
 * Gestiona los endpoints REST para el módulo de terceros (clientes y proveedores).
 *
 * Endpoints:
 * - POST /terceros: Crear un nuevo tercero
 * - GET /terceros: Listar terceros con filtros opcionales
 * - GET /terceros/:id: Obtener detalle de un tercero
 * - PATCH /terceros/:id: Actualizar un tercero
 * - DELETE /terceros/:id: Eliminar un tercero (soft delete)
 * - GET /terceros/:id/saldo: Obtener saldo actual de un tercero
 *
 * Seguridad:
 * - Todos los endpoints requieren autenticación JWT
 * - El empresaId se extrae automáticamente del token JWT
 */
@Controller('terceros')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Terceros')
export class TercerosController {
  constructor(private readonly tercerosService: TercerosService) {}

  /**
   * POST /terceros
   *
   * Crea un nuevo tercero (cliente o proveedor).
   *
   * Reglas:
   * - El nombre es obligatorio
   * - El tipo debe ser CLIENTE o PROVEEDOR
   * - El saldoActual se inicializa automáticamente en 0
   *
   * @param dto Datos del tercero a crear
   * @param req Request object con datos del usuario autenticado
   * @returns Tercero creado
   */
  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo tercero',
    description:
      'Registra un nuevo tercero (cliente o proveedor) con saldo inicial en 0',
  })
  @ApiResponse({
    status: 201,
    description: 'Tercero creado exitosamente',
    type: TerceroResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validación fallida',
  })
  async crear(
    @Body() dto: CrearTerceroDto,
    @Request() req: RequestWithUser,
  ): Promise<TerceroResponseDto> {
    const { empresaId, userId } = req.user;
    return this.tercerosService.crear(dto, empresaId, userId);
  }

  /**
   * GET /terceros
   *
   * Lista todos los terceros con filtros opcionales.
   *
   * Query Parameters:
   * - tipo: Filtrar por tipo (CLIENTE o PROVEEDOR)
   * - busqueda: Buscar por nombre (case-insensitive)
   *
   * Ordenamiento: Por nombre (ASC)
   *
   * @param query Parámetros de filtro
   * @param req Request object con datos del usuario autenticado
   * @returns Lista de terceros
   */
  @Get()
  @ApiOperation({
    summary: 'Listar terceros',
    description:
      'Obtiene un listado de terceros con filtros opcionales por tipo y búsqueda por nombre',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de terceros',
    type: [TerceroResponseDto],
  })
  async listar(
    @Query() query: ListarTercerosQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<TerceroResponseDto[]> {
    return this.tercerosService.listar(query, req.user.empresaId);
  }

  /**
   * GET /terceros/:id
   *
   * Obtiene el detalle completo de un tercero específico.
   *
   * IMPORTANTE: Este endpoint debe estar ANTES de GET /terceros/:id/saldo
   * para evitar conflictos de rutas, pero en este caso :id/saldo es más específico.
   *
   * @param id ID del tercero
   * @param req Request object con datos del usuario autenticado
   * @returns Detalle del tercero
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un tercero',
    description: 'Retorna la información completa de un tercero específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del tercero',
    type: TerceroResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tercero no encontrado',
  })
  async obtenerPorId(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<TerceroResponseDto> {
    return this.tercerosService.obtenerPorId(id, req.user.empresaId);
  }

  /**
   * PATCH /terceros/:id
   *
   * Actualiza los datos de un tercero existente.
   *
   * Reglas:
   * - Solo se actualizan los campos enviados
   * - No se puede actualizar el saldoActual (se calcula automáticamente)
   * - No se puede cambiar de empresa
   *
   * @param id ID del tercero
   * @param dto Datos a actualizar
   * @param req Request object con datos del usuario autenticado
   * @returns Tercero actualizado
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un tercero',
    description:
      'Actualiza los datos de un tercero existente. Solo se modifican los campos enviados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tercero actualizado exitosamente',
    type: TerceroResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tercero no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Validación fallida',
  })
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarTerceroDto,
    @Request() req: RequestWithUser,
  ): Promise<TerceroResponseDto> {
    return this.tercerosService.actualizar(id, dto, req.user.empresaId);
  }

  /**
   * DELETE /terceros/:id
   *
   * Elimina un tercero (soft delete).
   * El tercero se marca como eliminado pero no se borra físicamente.
   *
   * Validaciones:
   * - No se puede eliminar si tiene saldo pendiente diferente de 0
   *
   * @param id ID del tercero
   * @param req Request object con datos del usuario autenticado
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un tercero',
    description:
      'Marca un tercero como eliminado (soft delete). No se puede eliminar si tiene saldo pendiente.',
  })
  @ApiResponse({
    status: 204,
    description: 'Tercero eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Tercero no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El tercero tiene saldo pendiente y no puede eliminarse',
  })
  async eliminar(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.tercerosService.eliminar(id, req.user.empresaId);
  }

  /**
   * GET /terceros/:id/saldo
   *
   * Obtiene el saldo actual y estado de un tercero.
   *
   * Estados:
   * - DEUDOR: saldoActual > 0
   * - AL_DIA: saldoActual <= 0
   *
   * @param id ID del tercero
   * @param req Request object con datos del usuario autenticado
   * @returns Saldo y estado del tercero
   */
  @Get(':id/saldo')
  @ApiOperation({
    summary: 'Obtener saldo total de un cliente',
    description: 'Retorna el saldo actual y estado del cliente (DEUDOR/AL_DIA)',
  })
  @ApiResponse({
    status: 200,
    description: 'Saldo del tercero',
    type: SaldoTerceroResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  async getSaldo(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<SaldoTerceroResponseDto> {
    return this.tercerosService.getSaldo(id, req.user.empresaId);
  }
}
