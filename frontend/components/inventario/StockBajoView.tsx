'use client';

// ============================================================================
// STOCK BAJO VIEW - Vista de Productos con Stock Bajo
// ============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { useInventario } from '@/contexts/InventarioContext';
import { Table, Column } from '@/components/common';
import { StockBadge, STOCK_CRITICO_THRESHOLD } from './StockBadge';
import { STOCK_OBJETIVO_MULTIPLIER } from '@/lib/utils/inventario.constants';
import type { Producto, PaginatedResponse } from '@/lib/types/inventario.types';

export function StockBajoView() {
  const { fetchProductosBajoStock, loading } = useInventario();

  // Estado
  const [productos, setProductos] = useState<Producto[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginatedResponse<Producto> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetchProductosBajoStock({ page: currentPage, limit: 20 });
        if (response && isMounted) {
          setProductos(response.data);
          setPaginationInfo(response);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error al cargar productos:', error);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentPage, fetchProductosBajoStock]);

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getNivelCriticidad = useCallback((producto: Producto): 'critico' | 'bajo' | 'sin_stock' => {
    if (producto.stockActual === 0) return 'sin_stock';
    if (producto.stockActual <= producto.stockMinimo * STOCK_CRITICO_THRESHOLD) return 'critico';
    return 'bajo';
  }, []);

  // ============================================================================
  // TABLA
  // ============================================================================

  const columns: Column<Producto>[] = useMemo(
    () => [
      {
        key: 'alertLevel',
        header: '',
        className: 'w-12',
        render: (prod) => {
          const nivel = getNivelCriticidad(prod);
          return (
            <div className="flex items-center justify-center">
              {nivel === 'sin_stock' && (
                <div className="w-3 h-3 rounded-full bg-red-600" title="Sin stock - Urgente">
                  <span className="sr-only">Sin stock</span>
                </div>
              )}
              {nivel === 'critico' && (
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" title="Crítico" />
              )}
              {nivel === 'bajo' && (
                <div className="w-3 h-3 rounded-full bg-yellow-500" title="Bajo" />
              )}
            </div>
          );
        },
      },
      {
        key: 'nombre',
        header: 'Producto',
        render: (prod) => (
          <div>
            <p className="font-medium">{prod.nombre}</p>
            {prod.categoria && (
              <p className="text-xs text-gray-500">{prod.categoria.nombre}</p>
            )}
          </div>
        ),
      },
      {
        key: 'stock',
        header: 'Stock',
        render: (prod) => (
          <div className="space-y-1">
            <StockBadge
              stockActual={prod.stockActual}
              stockMinimo={prod.stockMinimo}
              showLabel={true}
            />
            <p className="text-xs text-gray-500">Mínimo: {prod.stockMinimo}</p>
          </div>
        ),
      },
      {
        key: 'necesita',
        header: 'Necesita Reabastecer',
        render: (prod) => {
          const stockObjetivo = prod.stockMinimo * STOCK_OBJETIVO_MULTIPLIER;
          const necesita = Math.max(0, stockObjetivo - prod.stockActual);
          return (
            <div>
              <p className="font-semibold text-gray-900">{necesita} unidades</p>
              <p className="text-xs text-gray-500">
                Para llegar a {stockObjetivo} (doble del mínimo)
              </p>
            </div>
          );
        },
      },
      {
        key: 'prioridad',
        header: 'Prioridad',
        render: (prod) => {
          const nivel = getNivelCriticidad(prod);
          if (nivel === 'sin_stock') {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                <AlertTriangle size={12} />
                Urgente
              </span>
            );
          }
          if (nivel === 'critico') {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                Alta
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
              Media
            </span>
          );
        },
      },
    ],
    [getNivelCriticidad]
  );

  // ============================================================================
  // MÉTRICAS
  // ============================================================================

  const metricas = useMemo(() => {
    return productos.reduce(
      (acc, p) => {
        const nivel = getNivelCriticidad(p);
        if (nivel === 'sin_stock') acc.urgentes++;
        else if (nivel === 'critico') acc.criticos++;
        else acc.bajos++;
        return acc;
      },
      { urgentes: 0, criticos: 0, bajos: 0 }
    );
  }, [productos, getNivelCriticidad]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Fijo */}
      <div className="shrink-0 space-y-6 py-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Productos con Stock Bajo</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Productos que requieren reabastecimiento urgente
          </p>
        </div>

        {/* Métricas */}
        {paginationInfo && paginationInfo.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{paginationInfo.total}</p>
                </div>
                <Package className="text-gray-400" size={32} />
              </div>
            </div>

            <div className="bg-red-50 rounded-lg border border-red-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Sin Stock</p>
                  <p className="text-2xl font-bold text-red-900">{metricas.urgentes}</p>
                  <p className="text-xs text-red-600 mt-1">Urgente</p>
                </div>
                <AlertTriangle className="text-red-600" size={32} />
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Stock Crítico</p>
                  <p className="text-2xl font-bold text-orange-900">{metricas.criticos}</p>
                  <p className="text-xs text-orange-600 mt-1">Alta prioridad</p>
                </div>
                <AlertTriangle className="text-orange-600" size={32} />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-900">{metricas.bajos}</p>
                  <p className="text-xs text-yellow-600 mt-1">Media prioridad</p>
                </div>
                <AlertTriangle className="text-yellow-600" size={32} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenido Scrolleable */}
      <div className="flex-1 overflow-y-auto">
        {/* Advertencia si no hay productos */}
        {!loading && productos.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  ¡Todo está en orden!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  No hay productos con stock bajo en este momento.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla */}
        {productos.length > 0 && (
          <Table
            columns={columns}
            data={productos}
            keyExtractor={(prod) => prod.id}
            pagination={
              paginationInfo
                ? {
                    page: paginationInfo.page,
                    limit: paginationInfo.limit,
                    total: paginationInfo.total,
                    totalPages: paginationInfo.totalPages,
                    hasNextPage: paginationInfo.hasNextPage,
                    hasPrevPage: paginationInfo.hasPrevPage,
                  }
                : undefined
            }
            onPageChange={handlePageChange}
            loading={loading}
            emptyMessage="No hay productos con stock bajo"
          />
        )}
      </div>
    </div>
  );
}
