'use client';

// ============================================================================
// PRODUCTOS TABLE - Tabla de Productos con Acciones
// ============================================================================

import { Edit, Trash2, Eye } from 'lucide-react';
import { Table, Column } from '@/components/common';
import { StockBadge } from './StockBadge';
import type { Producto, PaginatedResponse } from '@/lib/types/inventario.types';

interface ProductosTableProps {
  productos: Producto[];
  paginationInfo: PaginatedResponse<Producto> | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onView: (producto: Producto) => void;
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
  calcularMargen: (costo: number, venta: number) => number;
  isOwner?: boolean;
}

export function ProductosTable({
  productos,
  paginationInfo,
  isLoading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  calcularMargen,
  isOwner = false,
}: ProductosTableProps) {
  const columns: Column<Producto>[] = [
    {
      key: 'codigoBarras',
      header: 'Código',
      render: (prod) => (
        <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">{prod.codigoBarras || '—'}</span>
      ),
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (prod) => (
        <div>
          <p className="font-semibold text-gray-900">{prod.nombre}</p>
          {prod.categoria && (
            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
              {prod.categoria.nombre}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'precioVenta',
      header: 'Precio',
      render: (prod) => {
        const margen = calcularMargen(prod.precioCosto, prod.precioVenta);
        return (
          <div>
            <p className="font-bold text-gray-900">${prod.precioVenta.toFixed(2)}</p>
            <p className="text-xs text-gray-600 font-medium">Margen: {margen.toFixed(1)}%</p>
          </div>
        );
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (prod) => (
        <StockBadge
          stockActual={prod.stockActual}
          stockMinimo={prod.stockMinimo}
          showLabel={false}
        />
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-right',
      render: (prod) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(prod)}
            className="p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 hover:scale-110"
            title="Ver detalles"
          >
            <Eye size={18} />
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => onEdit(prod)}
                className="p-2 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all duration-200 hover:scale-110"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => onDelete(prod)}
                className="p-2 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all duration-200 hover:scale-110"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
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
      onPageChange={onPageChange}
      loading={isLoading}
      emptyMessage="No hay productos para mostrar"
    />
  );
}
