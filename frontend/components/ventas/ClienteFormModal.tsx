'use client';

// ============================================================================
// CLIENTE FORM MODAL - Formulario para Crear/Editar Clientes
// ============================================================================

import { useState, useEffect } from 'react';
import { X, User, MapPin, Tag, AlertCircle } from 'lucide-react';
import { useVentas } from '@/contexts/VentasContext';
import { TipoTercero, type TerceroResponseDto, type CrearTerceroDto, type ActualizarTerceroDto } from '@/lib/types/ventas.types';
import { validateTextLength, TEXT_LIMITS } from '@/lib/utils/validation.utils';

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: TerceroResponseDto | null;
  onSuccess?: () => void;
}

interface FormData {
  nombre: string;
  direccion: string;
  tipo: TipoTercero;
}

interface FormErrors {
  nombre?: string;
  direccion?: string;
  tipo?: string;
}

export function ClienteFormModal({ isOpen, onClose, cliente, onSuccess }: ClienteFormModalProps) {
  const { crearTercero, actualizarTercero, loading, error } = useVentas();

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    direccion: '',
    tipo: TipoTercero.CLIENTE,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos si es edición
  useEffect(() => {
    if (!isOpen) return;

    if (cliente) {
      setFormData({
        nombre: cliente.nombre,
        direccion: cliente.direccion || '',
        tipo: cliente.tipo,
      });
    } else {
      // Resetear formulario para nuevo cliente
      setFormData({
        nombre: '',
        direccion: '',
        tipo: TipoTercero.CLIENTE,
      });
    }
    setFormErrors({});
  }, [isOpen, cliente]);

  // ============================================================================
  // VALIDACIONES
  // ============================================================================

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validar nombre usando utilidad centralizada
    const nombreValidation = validateTextLength(
      formData.nombre,
      TEXT_LIMITS.NOMBRE_MIN,
      TEXT_LIMITS.NOMBRE_MAX,
      'El nombre'
    );
    if (!nombreValidation.isValid) {
      errors.nombre = nombreValidation.error;
    }

    // Validar dirección (opcional)
    if (formData.direccion) {
      const direccionValidation = validateTextLength(
        formData.direccion,
        0,
        TEXT_LIMITS.DIRECCION_MAX,
        'La dirección'
      );
      if (!direccionValidation.isValid) {
        errors.direccion = direccionValidation.error;
      }
    }

    // Validar tipo
    if (!formData.tipo) {
      errors.tipo = 'El tipo es obligatorio';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (cliente) {
        // EDITAR cliente existente
        const updateData: ActualizarTerceroDto = {
          nombre: formData.nombre.trim(),
          direccion: formData.direccion.trim() || undefined,
          tipo: formData.tipo,
        };

        const result = await actualizarTercero(cliente.id, updateData);
        if (result) {
          onSuccess?.();
          handleClose();
        }
      } else {
        // CREAR nuevo cliente
        const createData: CrearTerceroDto = {
          nombre: formData.nombre.trim(),
          direccion: formData.direccion.trim() || undefined,
          tipo: formData.tipo,
        };

        const result = await crearTercero(createData);
        if (result) {
          onSuccess?.();
          handleClose();
        }
      }
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        nombre: '',
        direccion: '',
        tipo: TipoTercero.CLIENTE,
      });
      setFormErrors({});
      onClose();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  const isEditMode = !!cliente;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-linear-to-r from-purple-600 to-purple-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg p-1 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <p className="mt-1 text-sm text-purple-100">
              {isEditMode
                ? 'Modifica los datos del cliente'
                : 'Completa los datos para agregar un nuevo cliente'}
            </p>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {/* Error General */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertCircle className="text-red-600 shrink-0" size={20} />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Campo: Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-gray-900 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  maxLength={200}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 placeholder:text-gray-400 ${
                    formErrors.nombre
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.nombre && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.nombre.length}/200 caracteres
              </p>
            </div>

            {/* Campo: Dirección */}
            <div>
              <label htmlFor="direccion" className="block text-sm font-semibold text-gray-900 mb-2">
                Dirección
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Ej: Av. Siempre Viva 742, Springfield"
                  maxLength={300}
                  rows={3}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none text-gray-900 placeholder:text-gray-400 ${
                    formErrors.direccion
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.direccion && (
                <p className="mt-1 text-sm text-red-600">{formErrors.direccion}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.direccion.length}/300 caracteres (opcional)
              </p>
            </div>

            {/* Campo: Tipo */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-semibold text-gray-900 mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value as TipoTercero)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors appearance-none text-gray-900 ${
                    formErrors.tipo
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  disabled={isSubmitting}
                >
                  <option value={TipoTercero.CLIENTE}>Cliente</option>
                  <option value={TipoTercero.PROVEEDOR}>Proveedor</option>
                </select>
              </div>
              {formErrors.tipo && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tipo}</p>
              )}
            </div>

            {/* Footer: Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : isEditMode ? (
                  'Actualizar Cliente'
                ) : (
                  'Crear Cliente'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
