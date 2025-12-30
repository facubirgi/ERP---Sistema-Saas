'use client';

// ============================================================================
// TABLE COMPONENT - Componente Reutilizable
// ============================================================================
// Tabla genérica con paginación, ordenamiento y estados

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// ============================================================================
// TABLE COMPONENT
// ============================================================================

export function Table<T>({
  columns,
  data,
  keyExtractor,
  pagination,
  onPageChange,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
  className = '',
}: TableProps<T>) {
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Table Container con scroll horizontal */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Header */}
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`
                        px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                        ${column.className || ''}
                      `}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Cargando...</p>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-500">{emptyMessage}</p>
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={keyExtractor(item)}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`
                            px-6 py-4 whitespace-nowrap text-sm text-gray-900
                            ${column.className || ''}
                          `}
                        >
                          {column.render
                            ? column.render(item)
                            : String(item[column.key as keyof T] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && !loading && data.length > 0 && (
        <TablePagination pagination={pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}

// ============================================================================
// TABLE PAGINATION
// ============================================================================

interface TablePaginationProps {
  pagination: PaginationInfo;
  onPageChange?: (page: number) => void;
}

const TablePagination = React.memo(({ pagination, onPageChange }: TablePaginationProps) => {
  const { page, total, totalPages, hasNextPage, hasPrevPage, limit } = pagination;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const handlePageChange = (newPage: number) => {
    onPageChange?.(newPage); // Uso de optional chaining
  };

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 mt-4">
      {/* Información de resultados - Siempre visible */}
      <div className="text-center sm:text-left mb-3 sm:mb-0">
        <p className="text-sm text-gray-700">
          Mostrando <span className="font-medium">{startItem}</span> a{' '}
          <span className="font-medium">{endItem}</span> de{' '}
          <span className="font-medium">{total}</span> resultados
        </p>
      </div>

      {/* Botones de paginación móvil */}
      <div className="flex-1 flex justify-between sm:hidden mb-3">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={!hasPrevPage}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!hasNextPage}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>

      {/* Navegación completa - Solo desktop */}
      <div className="hidden sm:flex sm:items-center sm:justify-center">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {/* Primera página */}
            <button
              aria-label="Primera página"
              onClick={() => handlePageChange(1)}
              disabled={!hasPrevPage}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Primera página</span>
            </button>

            {/* Página anterior */}
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={!hasPrevPage}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Números de página */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;

              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`
                    relative inline-flex items-center px-4 py-2 border text-sm font-medium
                    ${
                      page === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }
                  `}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Página siguiente */}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasNextPage}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Última página */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={!hasNextPage}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="h-5 w-5" />
            </button>
        </nav>
      </div>
    </div>
  );
});

TablePagination.displayName = 'TablePagination';

export default Table;
