'use client';

// ============================================================================
// INVENTARIO CONTEXT - Sistema SaaS
// ============================================================================
// Context para gestión de estado de inventario (productos y categorías)
// Proporciona CRUD completo con manejo de errores y loading states

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CategoriasApi, ProductosApi } from '@/lib/api';
import {
  Categoria,
  Producto,
  CreateCategoriaDto,
  UpdateCategoriaDto,
  CreateProductoDto,
  UpdateProductoDto,
  PaginatedResponse,
  PaginationDto,
  SearchProductoDto,
  InventarioMetricas,
  ProductoConEstado,
  StockStatus,
} from '@/lib/types/inventario.types';
import { useAuth } from './AuthContext';
import { STOCK_CRITICO_THRESHOLD } from '@/lib/utils/inventario.constants';

// ============================================================================
// TIPOS DEL CONTEXT
// ============================================================================

interface InventarioContextType {
  // Estado
  categorias: Categoria[];
  productos: Producto[];
  loading: boolean;
  error: string | null;

  // Categorías - CRUD
  fetchCategorias: (pagination?: PaginationDto) => Promise<PaginatedResponse<Categoria> | null>;
  fetchCategoriaById: (id: string) => Promise<Categoria | null>;
  createCategoria: (data: CreateCategoriaDto) => Promise<Categoria | null>;
  updateCategoria: (id: string, data: UpdateCategoriaDto) => Promise<Categoria | null>;
  deleteCategoria: (id: string) => Promise<boolean>;
  restoreCategoria: (id: string) => Promise<Categoria | null>;
  getCategoriasEliminadas: (pagination?: PaginationDto) => Promise<PaginatedResponse<Categoria> | null>;
  getCategoriaProductosCount: (id: string) => Promise<number | null>;

  // Productos - CRUD
  fetchProductos: (pagination?: PaginationDto) => Promise<PaginatedResponse<Producto> | null>;
  fetchProductoById: (id: string) => Promise<Producto | null>;
  searchProductos: (searchDto: SearchProductoDto) => Promise<PaginatedResponse<Producto> | null>;
  fetchProductosBajoStock: (pagination?: PaginationDto) => Promise<PaginatedResponse<Producto> | null>;
  createProducto: (data: CreateProductoDto) => Promise<Producto | null>;
  updateProducto: (id: string, data: UpdateProductoDto) => Promise<Producto | null>;
  deleteProducto: (id: string) => Promise<boolean>;

  // Utilidades
  calcularMetricas: () => InventarioMetricas;
  calcularEstadoProducto: (producto: Producto) => ProductoConEstado;
  clearError: () => void;
}

const InventarioContext = createContext<InventarioContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function InventarioProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Verifica si el usuario está autenticado
   * @returns true si está autenticado, false en caso contrario
   */
  const checkAuth = useCallback((): boolean => {
    if (!isAuthenticated) {
      setError('No autenticado');
      return false;
    }
    return true;
  }, [isAuthenticated]);

  /**
   * Maneja errores de forma centralizada
   */
  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    const errorMessage = err instanceof Error ? err.message : defaultMessage;
    setError(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // CATEGORÍAS
  // ============================================================================

  const fetchCategorias = useCallback(
    async (pagination?: PaginationDto): Promise<PaginatedResponse<Categoria> | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await CategoriasApi.getAll(pagination);
        setCategorias(response.data);
        return response;
      } catch (err) {
        handleError(err, 'Error al cargar categorías');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const fetchCategoriaById = useCallback(
    async (id: string): Promise<Categoria | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const categoria = await CategoriasApi.getById(id);
        return categoria;
      } catch (err) {
        handleError(err, 'Error al cargar categoría');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const createCategoria = useCallback(
    async (data: CreateCategoriaDto): Promise<Categoria | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const nuevaCategoria = await CategoriasApi.create(data);
        setCategorias((prev) => [...prev, nuevaCategoria]);
        return nuevaCategoria;
      } catch (err) {
        handleError(err, 'Error al crear categoría');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const updateCategoria = useCallback(
    async (id: string, data: UpdateCategoriaDto): Promise<Categoria | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const categoriaActualizada = await CategoriasApi.update(id, data);
        setCategorias((prev) =>
          prev.map((cat) => (cat.id === id ? categoriaActualizada : cat))
        );
        return categoriaActualizada;
      } catch (err) {
        handleError(err, 'Error al actualizar categoría');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const deleteCategoria = useCallback(
    async (id: string): Promise<boolean> => {
      if (!checkAuth()) return false;

      setLoading(true);
      setError(null);

      try {
        await CategoriasApi.softDelete(id);
        setCategorias((prev) => prev.filter((cat) => cat.id !== id));
        return true;
      } catch (err) {
        handleError(err, 'Error al eliminar categoría');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const restoreCategoria = useCallback(
    async (id: string): Promise<Categoria | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const categoriaRestaurada = await CategoriasApi.restore(id);
        return categoriaRestaurada;
      } catch (err) {
        handleError(err, 'Error al restaurar categoría');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const getCategoriasEliminadas = useCallback(
    async (pagination?: PaginationDto): Promise<PaginatedResponse<Categoria> | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await CategoriasApi.getDeleted(pagination);
        return response;
      } catch (err) {
        handleError(err, 'Error al cargar categorías eliminadas');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const getCategoriaProductosCount = useCallback(
    async (id: string): Promise<number | null> => {
      if (!checkAuth()) return null;

      try {
        const response = await CategoriasApi.getProductosCount(id);
        return response.count;
      } catch (err) {
        handleError(err, 'Error al contar productos de categoría');
        return null;
      }
    },
    [checkAuth, handleError]
  );

  // ============================================================================
  // PRODUCTOS
  // ============================================================================

  const fetchProductos = useCallback(
    async (pagination?: PaginationDto): Promise<PaginatedResponse<Producto> | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await ProductosApi.getAll(pagination);
        setProductos(response.data);
        return response;
      } catch (err) {
        handleError(err, 'Error al cargar productos');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const fetchProductoById = useCallback(
    async (id: string): Promise<Producto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const producto = await ProductosApi.getById(id);
        return producto;
      } catch (err) {
        handleError(err, 'Error al cargar producto');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const searchProductos = useCallback(
    async (searchDto: SearchProductoDto): Promise<PaginatedResponse<Producto> | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await ProductosApi.search(searchDto);
        return response;
      } catch (err) {
        handleError(err, 'Error al buscar productos');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const fetchProductosBajoStock = useCallback(
    async (pagination?: PaginationDto): Promise<PaginatedResponse<Producto> | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await ProductosApi.getBajoStock(pagination);
        return response;
      } catch (err) {
        handleError(err, 'Error al cargar productos con stock bajo');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const createProducto = useCallback(
    async (data: CreateProductoDto): Promise<Producto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const nuevoProducto = await ProductosApi.create(data);
        setProductos((prev) => [...prev, nuevoProducto]);
        return nuevoProducto;
      } catch (err) {
        handleError(err, 'Error al crear producto');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const updateProducto = useCallback(
    async (id: string, data: UpdateProductoDto): Promise<Producto | null> => {
      if (!checkAuth()) return null;

      setLoading(true);
      setError(null);

      try {
        const productoActualizado = await ProductosApi.update(id, data);
        setProductos((prev) =>
          prev.map((prod) => (prod.id === id ? productoActualizado : prod))
        );
        return productoActualizado;
      } catch (err) {
        handleError(err, 'Error al actualizar producto');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  const deleteProducto = useCallback(
    async (id: string): Promise<boolean> => {
      if (!checkAuth()) return false;

      setLoading(true);
      setError(null);

      try {
        await ProductosApi.deleteProducto(id);
        setProductos((prev) => prev.filter((prod) => prod.id !== id));
        return true;
      } catch (err) {
        handleError(err, 'Error al eliminar producto');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth, handleError]
  );

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  const calcularEstadoProducto = useCallback((producto: Producto): ProductoConEstado => {
    let stockStatus: StockStatus;

    if (producto.stockActual === 0) {
      stockStatus = StockStatus.SIN_STOCK;
    } else if (producto.stockActual <= producto.stockMinimo * STOCK_CRITICO_THRESHOLD) {
      stockStatus = StockStatus.CRITICO;
    } else if (producto.stockActual <= producto.stockMinimo) {
      stockStatus = StockStatus.BAJO;
    } else {
      stockStatus = StockStatus.NORMAL;
    }

    const margenGananciaAbsoluto = producto.precioVenta - producto.precioCosto;
    const margenGanancia =
      producto.precioCosto > 0
        ? (margenGananciaAbsoluto / producto.precioCosto) * 100
        : 0;

    return {
      ...producto,
      stockStatus,
      margenGanancia,
      margenGananciaAbsoluto,
    };
  }, []);

  const calcularMetricas = useCallback((): InventarioMetricas => {
    const totalProductos = productos.length;
    const productosBajoStock = productos.filter(
      (p) => p.stockActual <= p.stockMinimo && p.stockActual > 0
    ).length;
    const productosSinStock = productos.filter((p) => p.stockActual === 0).length;
    const valorTotalInventario = productos.reduce(
      (total, p) => total + p.precioVenta * p.stockActual,
      0
    );
    const totalCategorias = categorias.length;

    return {
      totalProductos,
      productosBajoStock,
      productosSinStock,
      valorTotalInventario,
      totalCategorias,
    };
  }, [productos, categorias]);

  // ============================================================================
  // CONTEXT VALUE - MEMOIZADO para prevenir re-renders innecesarios
  // ============================================================================

  const value: InventarioContextType = useMemo(
    () => ({
      // Estado
      categorias,
      productos,
      loading,
      error,

      // Categorías
      fetchCategorias,
      fetchCategoriaById,
      createCategoria,
      updateCategoria,
      deleteCategoria,
      restoreCategoria,
      getCategoriasEliminadas,
      getCategoriaProductosCount,

      // Productos
      fetchProductos,
      fetchProductoById,
      searchProductos,
      fetchProductosBajoStock,
      createProducto,
      updateProducto,
      deleteProducto,

      // Utilidades
      calcularMetricas,
      calcularEstadoProducto,
      clearError,
    }),
    [
      categorias,
      productos,
      loading,
      error,
      fetchCategorias,
      fetchCategoriaById,
      createCategoria,
      updateCategoria,
      deleteCategoria,
      restoreCategoria,
      getCategoriasEliminadas,
      getCategoriaProductosCount,
      fetchProductos,
      fetchProductoById,
      searchProductos,
      fetchProductosBajoStock,
      createProducto,
      updateProducto,
      deleteProducto,
      calcularMetricas,
      calcularEstadoProducto,
      clearError,
    ]
  );

  return (
    <InventarioContext.Provider value={value}>
      {children}
    </InventarioContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useInventario() {
  const context = useContext(InventarioContext);
  if (context === undefined) {
    throw new Error('useInventario debe usarse dentro de InventarioProvider');
  }
  return context;
}
