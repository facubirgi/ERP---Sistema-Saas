'use client';

// ============================================================================
// CATEGORIA FORM MODAL - Formulario de Creación/Edición de Categoría
// ============================================================================

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/common';

interface CategoriaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: { nombre: string };
  setFormData: (data: { nombre: string }) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  formErrors: string | null;
  isEdit?: boolean;
}

export function CategoriaFormModal({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  formErrors,
  isEdit = false,
}: CategoriaFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder:text-gray-400"
            placeholder={isEdit ? '' : 'Ej: Bebidas'}
            maxLength={100}
            autoFocus
          />
          {!isEdit && (
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 2 caracteres, máximo 100
            </p>
          )}
        </div>

        {formErrors && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{formErrors}</p>
          </div>
        )}

        <ModalFooter>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? (isEdit ? 'Guardando...' : 'Creando...') : (isEdit ? 'Guardar Cambios' : 'Crear Categoría')}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
