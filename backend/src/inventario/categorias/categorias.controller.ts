import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioRol } from '../../tenant/entities/usuario.entity';

/**
 * CONTROLLER DE CATEGORÍAS
 *
 * Endpoints:
 * - GET    /api/categorias          → Listar todas (paginado)
 * - GET    /api/categorias/deleted  → Listar eliminadas
 * - GET    /api/categorias/:id      → Obtener una
 * - POST   /api/categorias          → Crear
 * - PUT    /api/categorias/:id      → Actualizar
 * - DELETE /api/categorias/:id      → Soft delete (validación Restrict)
 * - POST   /api/categorias/:id/restore → Restaurar eliminada
 * - GET    /api/categorias/:id/productos-count → Contar productos
 */
@ApiTags('Categorías')
@Controller('categorias')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  /**
   * CREAR CATEGORÍA
   */
  @Post()
  @Roles(UsuarioRol.DUENO)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva categoría',
    description: 'Crea una categoría de productos para la empresa autenticada.',
  })
  @ApiResponse({
    status: 201,
    description: 'Categoría creada exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        nombre: 'Bebidas',
        empresaId: '987e6543-e21b-12d3-a456-426614174000',
        eliminado: false,
        deletedAt: null,
        createdAt: '2025-11-15T10:00:00.000Z',
        updatedAt: '2025-11-15T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o categoría duplicada',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async create(@Body() createCategoriaDto: CreateCategoriaDto) {
    return this.categoriasService.create(createCategoriaDto);
  }

  /**
   * LISTAR CATEGORÍAS (PAGINADO)
   */
  @Get()
  @ApiOperation({
    summary: 'Listar categorías activas (paginado)',
    description:
      'Retorna todas las categorías activas de la empresa con paginación.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías paginada',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            nombre: 'Bebidas',
            empresaId: '987e6543-e21b-12d3-a456-426614174000',
            eliminado: false,
          },
        ],
        total: 15,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.categoriasService.findAllPaginated(paginationDto);
  }

  /**
   * LISTAR CATEGORÍAS ELIMINADAS
   */
  @Get('deleted')
  @ApiOperation({
    summary: 'Listar categorías eliminadas',
    description:
      'Retorna categorías marcadas como eliminadas para gestión/restauración.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías eliminadas',
  })
  async findDeleted(@Query() paginationDto: PaginationDto) {
    return this.categoriasService.findDeleted(paginationDto);
  }

  /**
   * OBTENER CATEGORÍA POR ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener categoría por ID',
    description: 'Retorna los detalles de una categoría específica.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la categoría',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría encontrada',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        nombre: 'Bebidas',
        empresaId: '987e6543-e21b-12d3-a456-426614174000',
        eliminado: false,
        deletedAt: null,
        createdAt: '2025-11-15T10:00:00.000Z',
        updatedAt: '2025-11-15T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriasService.findOne(id);
  }

  /**
   * CONTAR PRODUCTOS DE UNA CATEGORÍA
   */
  @Get(':id/productos-count')
  @ApiOperation({
    summary: 'Contar productos de la categoría',
    description:
      'Retorna la cantidad de productos activos asociados a la categoría.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la categoría',
  })
  @ApiResponse({
    status: 200,
    description: 'Cantidad de productos',
    schema: {
      example: {
        count: 15,
      },
    },
  })
  async countProductos(@Param('id', ParseUUIDPipe) id: string) {
    const count = await this.categoriasService.countProductos(id);
    return { count };
  }

  /**
   * ACTUALIZAR CATEGORÍA
   */
  @Put(':id')
  @Roles(UsuarioRol.DUENO)
  @ApiOperation({
    summary: 'Actualizar categoría',
    description: 'Actualiza los datos de una categoría existente.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la categoría',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría actualizada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o nombre duplicado',
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoriaDto: UpdateCategoriaDto,
  ) {
    return this.categoriasService.update(id, updateCategoriaDto);
  }

  /**
   * ELIMINAR CATEGORÍA (SOFT DELETE)
   */
  @Delete(':id')
  @Roles(UsuarioRol.DUENO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar categoría (soft delete)',
    description:
      'Marca la categoría como eliminada. NO permite si tiene productos asociados (regla RESTRICT).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la categoría',
  })
  @ApiResponse({
    status: 204,
    description: 'Categoría eliminada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description:
      'No se puede eliminar la categoría porque tiene productos asociados',
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriasService.softDelete(id);
  }

  /**
   * RESTAURAR CATEGORÍA ELIMINADA
   */
  @Post(':id/restore')
  @Roles(UsuarioRol.DUENO)
  @ApiOperation({
    summary: 'Restaurar categoría eliminada',
    description: 'Restaura una categoría marcada como eliminada.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la categoría eliminada',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría restaurada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'La categoría no está eliminada o el nombre está duplicado',
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriasService.restore(id);
  }
}
