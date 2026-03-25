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
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { SearchProductoDto } from './dto/search-producto.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioRol } from '../../tenant/entities/usuario.entity';

/**
 * CONTROLLER DE PRODUCTOS
 *
 * Endpoints:
 * - GET    /api/productos              → Listar todos (paginado)
 * - GET    /api/productos/search       → Búsqueda híbrida (código + nombre)
 * - GET    /api/productos/bajo-stock   → Productos con stock bajo
 * - GET    /api/productos/:id          → Obtener uno
 * - POST   /api/productos              → Crear
 * - PUT    /api/productos/:id          → Actualizar (Margen Inteligente)
 * - DELETE /api/productos/:id          → Hard delete (permanente)
 * - POST   /api/productos/:id/restore  → Restaurar (deshabilitado)
 */
@ApiTags('Productos')
@Controller('productos')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  /**
   * CREAR PRODUCTO
   */
  @Post()
  @Roles(UsuarioRol.DUENO)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nuevo producto',
    description:
      'Crea un producto validando categoría, margen mínimo y código único.',
  })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        codigoBarras: '7790001234567',
        nombre: 'Coca Cola 500ml',
        precioCosto: 100.5,
        precioVenta: 150.0,
        stockActual: 50,
        stockMinimo: 5,
        categoriaId: '987e6543-e21b-12d3-a456-426614174000',
        empresaId: '111e2222-e33b-12d3-a456-426614174000',
        eliminado: false,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, categoría no encontrada, margen negativo o código duplicado',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  /**
   * LISTAR PRODUCTOS (PAGINADO)
   */
  @Get()
  @ApiOperation({
    summary: 'Listar productos activos (paginado)',
    description: 'Retorna todos los productos activos con sus categorías.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos paginada',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            codigoBarras: '7790001234567',
            nombre: 'Coca Cola 500ml',
            precioCosto: 100.5,
            precioVenta: 150.0,
            stockActual: 50,
            stockMinimo: 5,
            categoria: {
              id: '987e6543-e21b-12d3-a456-426614174000',
              nombre: 'Bebidas',
            },
          },
        ],
        total: 150,
        page: 1,
        limit: 20,
        totalPages: 8,
        hasNextPage: true,
        hasPrevPage: false,
      },
    },
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.productosService.findAllPaginated(paginationDto);
  }

  /**
   * BÚSQUEDA HÍBRIDA (CÓDIGO + NOMBRE)
   */
  @Get('search')
  @ApiOperation({
    summary: 'Búsqueda híbrida de productos (POS)',
    description:
      'Busca por código de barras exacto (prioridad) o nombre parcial (ILIKE). Optimizado para sistemas POS.',
  })
  @ApiQuery({
    name: 'termino',
    required: true,
    type: String,
    description: 'Código de barras o nombre del producto',
    example: '7790001234567',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda paginados',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            codigoBarras: '7790001234567',
            nombre: 'Coca Cola 500ml',
            precioCosto: 100.5,
            precioVenta: 150.0,
            stockActual: 50,
            categoria: {
              id: '987e6543-e21b-12d3-a456-426614174000',
              nombre: 'Bebidas',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 1,
        totalPages: 1,
      },
    },
  })
  async search(@Query() searchDto: SearchProductoDto) {
    return this.productosService.search(searchDto);
  }

  /**
   * PRODUCTOS CON STOCK BAJO
   */
  @Get('bajo-stock')
  @ApiOperation({
    summary: 'Listar productos con stock bajo',
    description:
      'Retorna productos donde stock_actual <= stock_minimo, ordenados por stock ascendente.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Productos con stock bajo',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            nombre: 'Coca Cola 500ml',
            stockActual: 2,
            stockMinimo: 5,
            categoria: {
              nombre: 'Bebidas',
            },
          },
        ],
        total: 8,
        page: 1,
        limit: 20,
      },
    },
  })
  async findBajoStock(@Query() paginationDto: PaginationDto) {
    return this.productosService.findBajoStock(paginationDto);
  }

  /**
   * OBTENER PRODUCTO POR ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener producto por ID',
    description: 'Retorna los detalles completos de un producto.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del producto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        codigoBarras: '7790001234567',
        nombre: 'Coca Cola 500ml',
        precioCosto: 100.5,
        precioVenta: 150.0,
        stockActual: 50,
        stockMinimo: 5,
        categoria: {
          id: '987e6543-e21b-12d3-a456-426614174000',
          nombre: 'Bebidas',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.findOne(id);
  }

  /**
   * ACTUALIZAR PRODUCTO (CON MARGEN INTELIGENTE)
   */
  @Put(':id')
  @Roles(UsuarioRol.DUENO)
  @ApiOperation({
    summary: 'Actualizar producto (Margen Inteligente)',
    description:
      'Actualiza un producto. Si se envía precioCosto sin precioVenta, calcula automáticamente el nuevo precioVenta manteniendo el margen actual.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del producto',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        precioCosto: 120.0,
        precioVenta: 180.0, // Calculado automáticamente con Margen Inteligente
        message: 'Precio de venta actualizado automáticamente (margen: 50%)',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, margen negativo o código de barras duplicado',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, updateProductoDto);
  }

  /**
   * ELIMINAR PRODUCTO (HARD DELETE)
   */
  @Delete(':id')
  @Roles(UsuarioRol.DUENO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar producto permanentemente',
    description:
      'Elimina completamente el producto de la base de datos. Esta acción es irreversible.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del producto',
  })
  @ApiResponse({
    status: 204,
    description: 'Producto eliminado permanentemente',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.productosService.hardDelete(id);
  }

  /**
   * RESTAURAR PRODUCTO ELIMINADO
   * NOTA: Deshabilitado - Los productos se eliminan permanentemente
   */
  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar producto eliminado (deshabilitado)',
    description:
      'Este endpoint ya no está disponible. Los productos se eliminan permanentemente y no pueden ser restaurados.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del producto eliminado',
  })
  @ApiResponse({
    status: 404,
    description: 'No se puede restaurar un producto eliminado permanentemente',
  })
  restore(@Param('id', ParseUUIDPipe) id: string): never {
    return this.productosService.restore(id);
  }
}
