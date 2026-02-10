'use client';

// ============================================================================
// CATEGORÍAS VIEW - Vista de Gestión de Categorías
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useInventario } from '@/contexts/InventarioContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { SearchBar, ConfirmDialog } from '@/components/common';
import { CategoriaFormModal } from './CategoriaFormModal';
import { CategoriasTable } from './CategoriasTable';
import { CATEGORIA_VALIDATION } from '@/lib/utils/inventario.constants';
import type { Categoria, CreateCategoriaDto, UpdateCategoriaDto, PaginatedResponse } from '@/lib/types/inventario.types';

export function CategoriasView() {
  const {
    fetchCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    getCategoriaProductosCount,
    loading,
    error,
  } = useInventario();

  const { success, error: showError, warning } = useNotifications();

  // Estado
  const [paginationInfo, setPaginationInfo] = useState<PaginatedResponse<Categoria> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null);
  const [productosCount, setProductosCount] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState({ nombre: '' });
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  const validateCategoriaForm = useCallback((nombre: string): string | null => {
    if (!nombre.trim()) {
      return 'El nombre es requerido';
    }
    if (nombre.length < CATEGORIA_VALIDATION.MIN_LENGTH || nombre.length > CATEGORIA_VALIDATION.MAX_LENGTH) {
      return `El nombre debe tener entre ${CATEGORIA_VALIDATION.MIN_LENGTH} y ${CATEGORIA_VALIDATION.MAX_LENGTH} caracteres`;
    }
    return null;
  }, []);

  const loadCategorias = useCallback(async () => {
    const response = await fetchCategorias({ page: currentPage, limit: 20 });
    if (response) {
      setPaginationInfo(response);
    }
  }, [fetchCategorias, currentPage]);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    // Llamar directamente a fetchCategorias en lugar de loadCategorias
    const loadData = async () => {
      const response = await fetchCategorias({ page: currentPage, limit: 20 });
      if (response) {
        setPaginationInfo(response);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleSearch = useCallback((_query: string) => {
    // TODO: Implementar búsqueda en el servidor cuando la API lo soporte
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const handleCreate = useCallback(() => {
    setFormData({ nombre: '' });
    setFormErrors(null);
    setIsCreateModalOpen(true);
  }, []);

  const handleEdit = useCallback((categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setFormData({ nombre: categoria.nombre });
    setFormErrors(null);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback(async (categoria: Categoria) => {
    // Verificar si tiene productos
    const count = await getCategoriaProductosCount(categoria.id);
    if (count !== null) {
      setProductosCount(count);
      setCategoriaToDelete(categoria);
      setDeleteConfirmOpen(true);
    }
  }, [getCategoriaProductosCount]);

  const handleSubmitCreate = useCallback(async () => {
    const validationError = validateCategoriaForm(formData.nombre);
    if (validationError) {
      setFormErrors(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormErrors(null);

    const dto: CreateCategoriaDto = { nombre: formData.nombre.trim() };
    const result = await createCategoria(dto);

    setIsSubmitting(false);

    if (result) {
      setIsCreateModalOpen(false);
      success('Categoría creada', 'La categoría se ha creado exitosamente.');
      await loadCategorias();
    } else if (error) {
      setFormErrors(error);
      showError('Error al crear categoría', error);
    }
  }, [formData, validateCategoriaForm, createCategoria, error, loadCategorias, success, showError]);

  const handleSubmitEdit = useCallback(async () => {
    if (!selectedCategoria) return;

    const validationError = validateCategoriaForm(formData.nombre);
    if (validationError) {
      setFormErrors(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormErrors(null);

    const dto: UpdateCategoriaDto = { nombre: formData.nombre.trim() };
    const result = await updateCategoria(selectedCategoria.id, dto);

    setIsSubmitting(false);

    if (result) {
      setIsEditModalOpen(false);
      success('Categoría actualizada', 'La categoría se ha actualizado exitosamente.');
      await loadCategorias();
    } else if (error) {
      setFormErrors(error);
      showError('Error al actualizar categoría', error);
    }
  }, [selectedCategoria, formData, validateCategoriaForm, updateCategoria, error, loadCategorias, success, showError]);

  const handleConfirmDelete = useCallback(async () => {
    if (!categoriaToDelete) return;

    // Verificar si tiene productos asociados
    if (productosCount > 0) {
      warning('No se puede eliminar', `Esta categoría tiene ${productosCount} producto(s) activo(s). Reasigna o elimina los productos primero.`);
      setDeleteConfirmOpen(false);
      return;
    }

    setIsSubmitting(true);
    const deleteSuccess = await deleteCategoria(categoriaToDelete.id);
    setIsSubmitting(false);

    if (deleteSuccess) {
      setDeleteConfirmOpen(false);
      setCategoriaToDelete(null);
      success('Categoría eliminada', `La categoría "${categoriaToDelete.nombre}" se ha eliminado exitosamente.`);
      await loadCategorias();
    } else if (error) {
      showError('Error al eliminar categoría', error);
    }
  }, [categoriaToDelete, deleteCategoria, loadCategorias, productosCount, success, showError, warning, error]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Fijo */}
      <div className="shrink-0 space-y-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona las categorías de productos de tu inventario
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={20} />
            Nueva Categoría
          </button>
        </div>

        {/* Búsqueda */}
        <SearchBar
          placeholder="Buscar categoría..."
          onSearch={handleSearch}
          className="max-w-md"
        />
      </div>

      {/* Contenido Scrolleable */}
      <div className="flex-1 overflow-y-auto">
        <CategoriasTable
          paginationInfo={paginationInfo}
          isLoading={loading}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Modal Crear */}
      <CategoriaFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nueva Categoría"
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmitCreate}
        isSubmitting={isSubmitting}
        formErrors={formErrors}
        isEdit={false}
      />

      {/* Modal Editar */}
      <CategoriaFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Categoría"
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmitEdit}
        isSubmitting={isSubmitting}
        formErrors={formErrors}
        isEdit={true}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Categoría"
        message={
          productosCount > 0
            ? `No se puede eliminar esta categoría porque tiene ${productosCount} producto(s) activo(s). Reasigna o elimina los productos primero.`
            : `¿Estás seguro de que deseas eliminar la categoría "${categoriaToDelete?.nombre}"? Esta acción se puede revertir desde la papelera.`
        }
        confirmText={productosCount > 0 ? 'Entendido' : 'Eliminar'}
        variant={productosCount > 0 ? 'warning' : 'danger'}
        loading={isSubmitting}
      />
    </div>
  );
}
