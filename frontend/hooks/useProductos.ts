// ============================================================================
// USE PRODUCTOS - Hook para gestión de productos
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { ProductosApi, CategoriasApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type {
  Producto,
  Categoria,
  CreateProductoDto,
  UpdateProductoDto,
  PaginatedResponse,
} from '@/lib/types/inventario.types';

interface UseProductosOptions {
  initialPage?: number;
  pageSize?: number;
}

export function useProductos(options: UseProductosOptions = {}) {
  const { initialPage = 1, pageSize = 20 } = options;
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useNotifications();

  // Estado
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginatedResponse<Producto> | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // CARGAR DATOS
  // ============================================================================

  /**
   * Carga productos con paginación
   */
  const loadProductos = useCallback(
    async (page?: number) => {
      if (!isAuthenticated) return;

      const targetPage = page ?? currentPage;
      setIsLoading(true);

      try {
        const response = await ProductosApi.getAll({
          page: targetPage,
          limit: pageSize,
        });

        setProductos(response.data);
        setPaginationInfo(response);
      } catch (error) {
        showError('Error al cargar productos', 'No se pudieron cargar los productos');
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, currentPage, pageSize, showError]
  );

  /**
   * Carga categorías
   */
  const loadCategorias = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await CategoriasApi.getAll({ page: 1, limit: 100 });
      setCategorias(response.data);
    } catch (error) {
      // silently fail - categorias are non-critical
    }
  }, [isAuthenticated]);

  /**
   * Efecto para cargar datos iniciales
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [productosResponse, categoriasResponse] = await Promise.all([
          ProductosApi.getAll({ page: currentPage, limit: pageSize }),
          CategoriasApi.getAll({ page: 1, limit: 100 }),
        ]);

        if (isMounted) {
          setProductos(productosResponse.data);
          setPaginationInfo(productosResponse);
          setCategorias(categoriasResponse.data);
        }
      } catch (error) {
        // handled by individual loaders
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentPage, isAuthenticated, pageSize]);

  // ============================================================================
  // BÚSQUEDA Y PAGINACIÓN
  // ============================================================================

  /**
   * Busca productos por término
   */
  const searchProductos = useCallback(
    async (query: string) => {
      if (!isAuthenticated) return;

      setCurrentPage(1);
      setIsLoading(true);

      try {
        const response =
          query.trim().length >= 2
            ? await ProductosApi.search({ termino: query, page: 1, limit: pageSize })
            : await ProductosApi.getAll({ page: 1, limit: pageSize });

        setProductos(response.data);
        setPaginationInfo(response);
      } catch (error) {
        showError('Error en la búsqueda', 'No se pudo realizar la búsqueda');
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, pageSize, showError]
  );

  /**
   * Cambia de página
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // ============================================================================
  // OPERACIONES CRUD
  // ============================================================================

  /**
   * Crea un nuevo producto
   */
  const createProducto = useCallback(
    async (dto: CreateProductoDto): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        await ProductosApi.create(dto);
        success('Producto creado', 'El producto se ha creado exitosamente.');
        await loadProductos(currentPage);
        return true;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error al crear el producto. Por favor, intenta de nuevo.';
        showError('Error al crear producto', errorMessage);
        return false;
      }
    },
    [isAuthenticated, currentPage, loadProductos, success, showError]
  );

  /**
   * Actualiza un producto existente
   */
  const updateProducto = useCallback(
    async (id: string, dto: UpdateProductoDto): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        await ProductosApi.update(id, dto);
        success('Producto actualizado', 'El producto se ha actualizado exitosamente.');
        await loadProductos(currentPage);
        return true;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el producto. Por favor, intenta de nuevo.';
        showError('Error al actualizar producto', errorMessage);
        return false;
      }
    },
    [isAuthenticated, currentPage, loadProductos, success, showError]
  );

  /**
   * Elimina un producto (soft delete)
   */
  const deleteProducto = useCallback(
    async (id: string, nombre: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        await ProductosApi.deleteProducto(id);
        success('Producto eliminado', `El producto "${nombre}" se ha eliminado exitosamente.`);
        await loadProductos(currentPage);
        return true;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el producto. Por favor, intenta de nuevo.';
        showError('Error al eliminar producto', errorMessage);
        return false;
      }
    },
    [isAuthenticated, currentPage, loadProductos, success, showError]
  );

  return {
    // Estado
    productos,
    categorias,
    paginationInfo,
    currentPage,
    isLoading,

    // Acciones
    loadProductos,
    loadCategorias,
    searchProductos,
    handlePageChange,
    createProducto,
    updateProducto,
    deleteProducto,
  };
}
