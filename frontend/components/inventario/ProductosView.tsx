'use client';

// ============================================================================
// PRODUCTOS VIEW - Vista de Gestión de Productos (REFACTORIZADO)
// ============================================================================

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SearchBar, Modal, ConfirmDialog } from '@/components/common';
import { ProductoFormModal } from './ProductoFormModal';
import { ProductoDetails } from './ProductoDetails';
import { ProductosTable } from './ProductosTable';
import { useProductos } from '@/hooks/useProductos';
import { useProductoForm } from '@/hooks/useProductoForm';
import { calcularMargen } from '@/lib/utils/producto.utils';
import type { Producto } from '@/lib/types/inventario.types';

export function ProductosView() {
  const { isAuthenticated, loading: authLoading, isOwner } = useAuth();

  // Hooks personalizados
  const {
    productos,
    categorias,
    paginationInfo,
    isLoading,
    searchProductos,
    handlePageChange,
    createProducto,
    updateProducto,
    deleteProducto,
  } = useProductos();

  // Estado de modales y selección
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null);

  // Hook para formulario de creación
  const createForm = useProductoForm({
    onSubmit: createProducto,
    onSubmitSuccess: () => setIsCreateModalOpen(false),
  });

  // Hook para formulario de edición
  const editForm = useProductoForm({
    onSubmit: (dto) => {
      if (!selectedProducto) return Promise.resolve(false);
      return updateProducto(selectedProducto.id, dto);
    },
    onSubmitSuccess: () => setIsEditModalOpen(false),
    initialData: selectedProducto || undefined,
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = () => {
    createForm.resetForm();
    setIsCreateModalOpen(true);
  };

  const handleView = (producto: Producto) => {
    setSelectedProducto(producto);
    setIsViewModalOpen(true);
  };

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto);
    editForm.loadProductoData(producto);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (producto: Producto) => {
    setProductoToDelete(producto);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productoToDelete) return;

    const success = await deleteProducto(productoToDelete.id, productoToDelete.nombre);
    
    if (success) {
      setDeleteConfirmOpen(false);
      setProductoToDelete(null);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Si no está autenticado, mostrar mensaje
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Autenticación requerida
          </h3>
          <p className="text-gray-600">
            Por favor, inicia sesión para ver los productos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Fijo */}
      <div className="shrink-0 space-y-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona todos los productos de tu inventario
            </p>
          </div>
          {isOwner && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus size={20} />
              Nuevo Producto
            </button>
          )}
        </div>

        {/* Búsqueda */}
        <SearchBar
          placeholder="Buscar por código de barras o nombre..."
          onSearch={searchProductos}
          className="max-w-md"
        />
      </div>

      {/* Contenido Scrolleable */}
      <div className="flex-1 overflow-y-auto">
        <ProductosTable
          productos={productos}
          paginationInfo={paginationInfo}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          calcularMargen={calcularMargen}
          isOwner={isOwner}
        />
      </div>

      {/* Modal Crear */}
      {isCreateModalOpen && (
        <ProductoFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Nuevo Producto"
          formData={createForm.formData}
          setFormData={createForm.setFormData}
          categorias={categorias}
          mantenerMargen={createForm.mantenerMargen}
          setMantenerMargen={createForm.setMantenerMargen}
          onSubmit={createForm.handleSubmit}
          isSubmitting={createForm.isSubmitting}
          formErrors={createForm.formErrors}
          calcularMargen={calcularMargen}
        />
      )}

      {/* Modal Editar */}
      {isEditModalOpen && selectedProducto && (
        <ProductoFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Editar Producto"
          formData={editForm.formData}
          setFormData={editForm.setFormData}
          categorias={categorias}
          mantenerMargen={editForm.mantenerMargen}
          setMantenerMargen={editForm.setMantenerMargen}
          onSubmit={editForm.handleSubmit}
          isSubmitting={editForm.isSubmitting}
          formErrors={editForm.formErrors}
          calcularMargen={calcularMargen}
        />
      )}

      {/* Modal Ver */}
      {selectedProducto && isViewModalOpen && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Detalles del Producto"
          size="md"
        >
          <ProductoDetails producto={selectedProducto} calcularMargen={calcularMargen} />
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Producto Permanentemente"
        message={`¿Estás seguro de que deseas eliminar "${productoToDelete?.nombre}"? Esta acción es PERMANENTE e IRREVERSIBLE. El producto se eliminará completamente de la base de datos.`}
        confirmText="Eliminar Permanentemente"
        variant="danger"
        loading={editForm.isSubmitting || createForm.isSubmitting}
      />
    </div>
  );
}
