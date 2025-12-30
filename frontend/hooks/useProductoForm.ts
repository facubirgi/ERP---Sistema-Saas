// ============================================================================
// USE PRODUCTO FORM - Hook para gestión del formulario de productos
// ============================================================================

import { useState, useCallback } from 'react';
import type { Producto, CreateProductoDto } from '@/lib/types/inventario.types';
import {
  validateProductoForm,
  normalizeProductoDto,
  createEmptyProductoDto,
} from '@/lib/utils/producto.utils';

interface UseProductoFormOptions {
  onSubmitSuccess?: () => void;
  onSubmit: (dto: CreateProductoDto) => Promise<boolean>;
  initialData?: Producto;
}

export function useProductoForm(options: UseProductoFormOptions) {
  const { onSubmitSuccess, onSubmit, initialData } = options;

  // Estado del formulario
  const [formData, setFormData] = useState<CreateProductoDto>(
    initialData
      ? {
          codigoBarras: initialData.codigoBarras || '',
          nombre: initialData.nombre,
          precioCosto: initialData.precioCosto,
          precioVenta: initialData.precioVenta,
          stockActual: initialData.stockActual,
          stockMinimo: initialData.stockMinimo,
          categoriaId: initialData.categoriaId,
        }
      : createEmptyProductoDto()
  );

  const [mantenerMargen, setMantenerMargen] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Resetea el formulario a valores iniciales
   */
  const resetForm = useCallback(() => {
    setFormData(createEmptyProductoDto());
    setMantenerMargen(false);
    setFormErrors(null);
    setIsSubmitting(false);
  }, []);

  /**
   * Carga datos de un producto existente en el formulario
   */
  const loadProductoData = useCallback((producto: Producto) => {
    setFormData({
      codigoBarras: producto.codigoBarras || '',
      nombre: producto.nombre,
      precioCosto: producto.precioCosto,
      precioVenta: producto.precioVenta,
      stockActual: producto.stockActual,
      stockMinimo: producto.stockMinimo,
      categoriaId: producto.categoriaId,
    });
    setMantenerMargen(false);
    setFormErrors(null);
  }, []);

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = useCallback(async () => {
    // Validar formulario
    const validation = validateProductoForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.error || 'Error de validación');
      return;
    }

    setIsSubmitting(true);
    setFormErrors(null);

    // Normalizar datos - siempre será CreateProductoDto porque formData es CreateProductoDto
    const normalizedDto = normalizeProductoDto(formData);

    // Si mantener margen está activado y solo cambió el costo, recalcular precioVenta
    let finalDto: CreateProductoDto;
    if (mantenerMargen && initialData && formData.precioCosto !== initialData.precioCosto) {
      // Calcular nuevo precio de venta manteniendo el margen
      const margenActual = initialData.precioVenta - initialData.precioCosto;
      const nuevoMargenPorcentaje = (margenActual / initialData.precioCosto) * 100;
      const nuevoPrecioVenta = formData.precioCosto * (1 + nuevoMargenPorcentaje / 100);
      
      finalDto = {
        ...normalizedDto,
        precioVenta: Number(nuevoPrecioVenta.toFixed(2)),
      };
    } else {
      finalDto = normalizedDto;
    }

    try {
      const success = await onSubmit(finalDto);
      
      if (success) {
        resetForm();
        onSubmitSuccess?.();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el formulario. Por favor, intenta de nuevo.';
      setFormErrors(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mantenerMargen, initialData, onSubmit, onSubmitSuccess, resetForm]);

  /**
   * Actualiza un campo del formulario
   */
  const updateField = useCallback(
    <K extends keyof CreateProductoDto>(field: K, value: CreateProductoDto[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      
      // Limpiar errores al editar
      if (formErrors) {
        setFormErrors(null);
      }
    },
    [formErrors]
  );

  /**
   * Actualiza múltiples campos del formulario
   */
  const updateFields = useCallback((updates: Partial<CreateProductoDto>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    
    // Limpiar errores al editar
    if (formErrors) {
      setFormErrors(null);
    }
  }, [formErrors]);

  return {
    // Estado
    formData,
    mantenerMargen,
    formErrors,
    isSubmitting,

    // Setters
    setFormData,
    setMantenerMargen,
    setFormErrors,

    // Acciones
    resetForm,
    loadProductoData,
    handleSubmit,
    updateField,
    updateFields,
  };
}
