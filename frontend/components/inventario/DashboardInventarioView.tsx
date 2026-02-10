'use client';

// ============================================================================
// DASHBOARD INVENTARIO VIEW - Vista Principal del Dashboard
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package,
  FolderOpen,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Plus,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useInventario } from '@/contexts/InventarioContext';
import { formatCurrency } from '@/lib/utils/format.utils';
import { MetricCard } from './MetricCard';
import { SearchBar } from '@/components/common';
import { StockBadge } from './StockBadge';
import type { Producto } from '@/lib/types/inventario.types';

interface DashboardInventarioViewProps {
  onNavigateToTab: (tabId: string) => void;
  onNavigateToNewProduct: () => void;
  onNavigateToNewCategory: () => void;
}

export function DashboardInventarioView({
  onNavigateToTab,
  onNavigateToNewProduct,
  onNavigateToNewCategory,
}: DashboardInventarioViewProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { fetchProductos, fetchCategorias, searchProductos } = useInventario();

  const [recentProducts, setRecentProducts] = useState<Producto[]>([]);
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const isLoadingRef = useRef(false);
  const [metricas, setMetricas] = useState({
    totalProductos: 0,
    productosBajoStock: 0,
    productosSinStock: 0,
    valorTotalInventario: 0,
    totalCategorias: 0,
  });

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  const loadDashboardData = useCallback(async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    try {
      // Cargar productos y categorías en paralelo
      const [productosResponse, categoriasResponse] = await Promise.all([
        fetchProductos({ page: 1, limit: 100 }), // Cargar todos para métricas
        fetchCategorias({ page: 1, limit: 100 }),
      ]);

      if (productosResponse && categoriasResponse) {
        // Guardar productos recientes (primeros 5)
        setRecentProducts(productosResponse.data.slice(0, 5));

        // Calcular métricas directamente de las respuestas
        const productos = productosResponse.data;
        const productosBajoStock = productos.filter(
          (p) => p.stockActual <= p.stockMinimo && p.stockActual > 0
        ).length;
        const productosSinStock = productos.filter((p) => p.stockActual === 0).length;
        const valorTotalInventario = productos.reduce(
          (total, p) => total + p.precioVenta * p.stockActual,
          0
        );

        const metrics = {
          totalProductos: productos.length,
          productosBajoStock,
          productosSinStock,
          valorTotalInventario,
          totalCategorias: categoriasResponse.data.length,
        };

        setMetricas(metrics);
      }
    } catch (error) {
      // Error loading dashboard data
    } finally {
      isLoadingRef.current = false;
    }
  }, [fetchProductos, fetchCategorias]);

  const handleSearch = async (query: string) => {
    if (query.trim().length >= 2) {
      setIsSearching(true);
      try {
        const response = await searchProductos({ termino: query, page: 1, limit: 5 });
        if (response) {
          setSearchResults(response.data);
        }
      } catch (error) {
        // Error al buscar
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // ============================================================================
  // EFECTOS
  // ============================================================================

  // Cargar datos cuando el usuario esté autenticado
  useEffect(() => {
    // Esperar a que termine de cargar el AuthContext
    if (authLoading) {
      return;
    }

    // Si no está autenticado después de cargar, no intentar cargar datos
    if (!isAuthenticated) {
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, authLoading, loadDashboardData]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-8">
      {/* Métricas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Productos"
          value={metricas.totalProductos}
          icon={Package}
          description="Productos activos"
          color="blue"
          onClick={() => onNavigateToTab('productos')}
        />

        <MetricCard
          title="Categorías"
          value={metricas.totalCategorias}
          icon={FolderOpen}
          description="Categorías activas"
          color="purple"
          onClick={() => onNavigateToTab('categorias')}
        />

        <MetricCard
          title="Stock Bajo"
          value={metricas.productosBajoStock}
          icon={AlertTriangle}
          description={`${metricas.productosSinStock} sin stock`}
          color="yellow"
          onClick={() => onNavigateToTab('stock-bajo')}
        />

        <MetricCard
          title="Valor Total"
          value={formatCurrency(metricas.valorTotalInventario)}
          icon={DollarSign}
          description="Valor del inventario"
          color="green"
        />
      </div>

      {/* Búsqueda Rápida */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-linear-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
            <Search className="text-white" size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Búsqueda Rápida</h3>
        </div>

        <SearchBar
          placeholder="Escanear código de barras o buscar por nombre..."
          onSearch={handleSearch}
          className="mb-4"
        />

        {isSearching && searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-3">Resultados encontrados:</p>
            {searchResults.map((producto) => (
              <div
                key={producto.id}
                className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-100/50 rounded-lg hover:from-red-50 hover:to-red-100/50 transition-all duration-200 border border-gray-200 hover:border-red-300 hover:shadow-md"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{producto.nombre}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {producto.categoria?.nombre} • <span className="font-bold">${producto.precioVenta.toFixed(2)}</span>
                  </p>
                </div>
                <StockBadge
                  stockActual={producto.stockActual}
                  stockMinimo={producto.stockMinimo}
                  showLabel={false}
                />
              </div>
            ))}
          </div>
        )}

        {isSearching && searchResults.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-6 bg-gray-50 rounded-lg">No se encontraron productos</p>
        )}
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <h3 className="text-lg font-bold text-gray-900 mb-5">Acciones Rápidas</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onNavigateToNewProduct}
            className="flex items-center justify-between p-5 border-2 border-red-200 rounded-xl hover:border-red-500 bg-linear-to-r from-red-50 to-red-100/30 hover:from-red-100 hover:to-red-200/50 transition-all duration-300 group shadow-sm hover:shadow-lg hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                <Plus className="text-white" size={22} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Nuevo Producto</p>
                <p className="text-sm text-gray-600">Agregar producto al inventario</p>
              </div>
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300" size={22} />
          </button>

          <button
            onClick={onNavigateToNewCategory}
            className="flex items-center justify-between p-5 border-2 border-purple-200 rounded-xl hover:border-purple-500 bg-linear-to-r from-purple-50 to-purple-100/30 hover:from-purple-100 hover:to-purple-200/50 transition-all duration-300 group shadow-sm hover:shadow-lg hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                <Plus className="text-white" size={22} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Nueva Categoría</p>
                <p className="text-sm text-gray-600">Crear categoría de productos</p>
              </div>
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-300" size={22} />
          </button>
        </div>
      </div>

      {/* Productos Recientes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Productos Recientes</h3>
          <button
            onClick={() => onNavigateToTab('productos')}
            className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all duration-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg"
          >
            Ver todos
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {recentProducts.length > 0 ? (
            recentProducts.map((producto) => (
              <div
                key={producto.id}
                className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-100/50 rounded-lg hover:from-red-50 hover:to-red-100/50 border border-gray-200 hover:border-red-300 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{producto.nombre}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {producto.categoria?.nombre} • Costo: <span className="font-bold">${producto.precioCosto.toFixed(2)}</span> • Venta: <span className="font-bold">${producto.precioVenta.toFixed(2)}</span>
                  </p>
                </div>
                <StockBadge
                  stockActual={producto.stockActual}
                  stockMinimo={producto.stockMinimo}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Package className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-sm text-gray-600 font-medium">
                No hay productos para mostrar.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Comienza agregando tu primer producto.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
