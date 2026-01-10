'use client';

// ============================================================================
// CATEGORIAS TABLE - Tabla de Categorías con Acciones
// ============================================================================

import { Edit, Trash2, FolderOpen } from 'lucide-react';
import { Table, Column } from '@/components/common';
import type { Categoria, PaginatedResponse } from '@/lib/types/inventario.types';

interface CategoriasTableProps {
  paginationInfo: PaginatedResponse<Categoria> | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onEdit: (categoria: Categoria) => void;
  onDelete: (categoria: Categoria) => void;
}

export function CategoriasTable({
  paginationInfo,
  isLoading,
  onPageChange,
  onEdit,
  onDelete,
}: CategoriasTableProps) {
  const columns: Column<Categoria>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (cat) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <FolderOpen className="text-white" size={20} />
          </div>
          <span className="font-semibold text-gray-900">{cat.nombre}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha Creación',
      render: (cat) => (
        <span className="text-sm text-gray-700 font-medium">
          {new Date(cat.createdAt).toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-right',
      render: (cat) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(cat)}
            className="p-2 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all duration-200 hover:scale-110"
            title="Editar"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="p-2 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all duration-200 hover:scale-110"
            title="Eliminar"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={paginationInfo?.data || []}
      keyExtractor={(cat) => cat.id}
      pagination={paginationInfo ? {
        page: paginationInfo.page,
        limit: paginationInfo.limit,
        total: paginationInfo.total,
        totalPages: paginationInfo.totalPages,
        hasNextPage: paginationInfo.hasNextPage,
        hasPrevPage: paginationInfo.hasPrevPage,
      } : undefined}
      onPageChange={onPageChange}
      loading={isLoading}
      emptyMessage="No hay categorías para mostrar"
    />
  );
}
