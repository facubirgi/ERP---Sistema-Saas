// ============================================================================
// TIPOS DE INVENTARIO - Sistema SaaS
// ============================================================================
// Tipos TypeScript que reflejan las entidades y DTOs del backend
// Sincronizados con: backend/src/inventario/

// ============================================================================
// ENTIDADES
// ============================================================================

/**
 * Categoría de productos
 * Mapea a: backend/src/inventario/categorias/entities/categoria.entity.ts
 */
export interface Categoria {
  id: string; // UUID
  nombre: string;
  empresaId: string; // UUID - filtrado automático por backend
  eliminado: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Producto del inventario
 * Mapea a: backend/src/inventario/productos/entities/producto.entity.ts
 */
export interface Producto {
  id: string; // UUID
  codigoBarras: string | null;
  nombre: string;
  precioCosto: number; // Decimal en backend
  precioVenta: number; // Decimal en backend
  stockActual: number;
  stockMinimo: number;
  categoriaId: string; // UUID
  empresaId: string; // UUID - filtrado automático por backend
  eliminado: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relación incluida en algunas respuestas
  categoria?: {
    id: string;
    nombre: string;
  };
}

// ============================================================================
// DTOs - CREATE
// ============================================================================

/**
 * DTO para crear nueva categoría
 * Mapea a: backend/src/inventario/categorias/dto/create-categoria.dto.ts
 */
export interface CreateCategoriaDto {
  nombre: string; // Min: 2, Max: 100 caracteres
}

/**
 * DTO para crear nuevo producto
 * Mapea a: backend/src/inventario/productos/dto/create-producto.dto.ts
 */
export interface CreateProductoDto {
  codigoBarras?: string; // Opcional, max 50 caracteres, único por empresa
  nombre: string; // Max 200 caracteres
  precioCosto: number; // > 0.01
  precioVenta: number; // >= precioCosto
  stockActual?: number; // >= 0, default 0
  stockMinimo?: number; // >= 0, default 5
  categoriaId: string; // UUID - debe existir
}

// ============================================================================
// DTOs - UPDATE
// ============================================================================

/**
 * DTO para actualizar categoría
 * Mapea a: backend/src/inventario/categorias/dto/update-categoria.dto.ts
 */
export interface UpdateCategoriaDto {
  nombre?: string;
}

/**
 * DTO para actualizar producto
 * Mapea a: backend/src/inventario/productos/dto/update-producto.dto.ts
 * NOTA: Soporta "Margen Inteligente" si se actualiza precioCosto sin precioVenta
 */
export interface UpdateProductoDto {
  codigoBarras?: string;
  nombre?: string;
  precioCosto?: number;
  precioVenta?: number;
  stockActual?: number;
  stockMinimo?: number;
  categoriaId?: string;
}

// ============================================================================
// DTOs - SEARCH & PAGINATION
// ============================================================================

/**
 * DTO para búsqueda de productos
 * Mapea a: backend/src/inventario/productos/dto/search-producto.dto.ts
 */
export interface SearchProductoDto {
  termino: string; // Min 2 caracteres
  page?: number; // Default 1
  limit?: number; // Default 20
}

/**
 * DTO genérico de paginación
 * Mapea a: backend/src/common/dto/pagination.dto.ts
 */
export interface PaginationDto {
  page?: number; // >= 1, default 1
  limit?: number; // 1-100, default 20
}

// ============================================================================
// RESPUESTAS PAGINADAS
// ============================================================================

/**
 * Respuesta paginada genérica del backend
 * Usada por todos los endpoints con paginación
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number; // Total de items en BD
  page: number; // Página actual
  limit: number; // Items por página
  totalPages: number; // Total de páginas
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============================================================================
// RESPUESTAS ESPECIALES
// ============================================================================

/**
 * Respuesta del endpoint de conteo de productos por categoría
 * GET /api/categorias/:id/productos-count
 */
export interface CategoriaProductosCountResponse {
  count: number;
}

/**
 * Respuesta estándar de operaciones exitosas (sin datos)
 * Usada en: DELETE, RESTORE
 */
export interface SuccessResponse {
  message: string;
}

// ============================================================================
// TIPOS AUXILIARES PARA UI
// ============================================================================

/**
 * Estado del stock para visualización
 */
export enum StockStatus {
  NORMAL = 'normal', // stock > stockMinimo
  BAJO = 'bajo', // stock <= stockMinimo && stock > 0
  CRITICO = 'critico', // stock <= 25% stockMinimo
  SIN_STOCK = 'sin_stock', // stock === 0
}

/**
 * Producto con información calculada para UI
 */
export interface ProductoConEstado extends Producto {
  stockStatus: StockStatus;
  margenGanancia: number; // Porcentaje calculado
  margenGananciaAbsoluto: number; // Valor absoluto
}

/**
 * Métricas del inventario para dashboard
 */
export interface InventarioMetricas {
  totalProductos: number;
  productosBajoStock: number;
  productosSinStock: number;
  valorTotalInventario: number;
  totalCategorias: number;
}

/**
 * Filtros para productos (state local del componente)
 */
export interface ProductosFiltros {
  categoriaId?: string;
  stockStatus?: StockStatus;
  precioMin?: number;
  precioMax?: number;
  busqueda?: string;
}

/**
 * Ordenamiento para tablas
 */
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  campo: keyof Producto | keyof Categoria;
  direccion: SortDirection;
}
