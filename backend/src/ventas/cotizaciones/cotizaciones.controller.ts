import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { CotizacionesService } from './cotizaciones.service';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { Request } from 'express';

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

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@ApiTags('Cotizaciones')
@Controller('cotizaciones')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  /**
   * POST /cotizaciones
   * Crear nueva cotización
   */
  @Post()
  async crear(
    @Body() dto: CrearCotizacionDto,
    @Req() req: RequestWithUser,
  ): Promise<CotizacionResponseDto> {
    const { empresaId, nombre } = req.user;
    return this.cotizacionesService.crearCotizacion(dto, empresaId, nombre);
  }

  /**
   * GET /cotizaciones
   * Listar cotizaciones con filtros
   */
  @Get()
  async listar(
    @Query() query: ListarCotizacionesQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<CotizacionListItemDto[]> {
    const { empresaId } = req.user;
    return this.cotizacionesService.listarCotizaciones(empresaId, query);
  }

  /**
   * GET /cotizaciones/:id
   * Obtener detalle de cotización
   */
  @Get(':id')
  async obtenerDetalle(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<DetalleCotizacionResponseDto> {
    const { empresaId } = req.user;
    return this.cotizacionesService.obtenerDetalleCotizacion(id, empresaId);
  }

  /**
   * PATCH /cotizaciones/:id
   * Actualizar cotización
   */
  @Patch(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarCotizacionDto,
    @Req() req: RequestWithUser,
  ): Promise<CotizacionResponseDto> {
    const { empresaId } = req.user;
    return this.cotizacionesService.actualizarCotizacion(id, dto, empresaId);
  }

  /**
   * POST /cotizaciones/:id/generar-venta
   * Generar una venta desde una cotización
   */
  @Post(':id/generar-venta')
  @ApiOperation({
    summary: 'Generar venta desde cotización',
    description:
      'Convierte una cotización en una venta nueva. Los items de la cotización se convierten en items de venta y se descuenta el stock.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la cotización',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Venta generada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Cotización no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o stock insuficiente',
  })
  async generarVenta(
    @Param('id') id: string,
    @Body() dto: GenerarVentaDesdeCotizacionDto,
    @Req() req: RequestWithUser,
  ): Promise<VentaResponseDto> {
    const { empresaId } = req.user;
    return this.cotizacionesService.generarVentaDesdeCotizacion(
      id,
      dto,
      empresaId,
    );
  }

  /**
   * DELETE /cotizaciones/:id
   * Eliminar cotización (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const { empresaId } = req.user;
    await this.cotizacionesService.eliminarCotizacion(id, empresaId);
  }
}
