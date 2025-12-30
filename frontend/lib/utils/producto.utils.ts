// ============================================================================
// PRODUCTO UTILS - Utilidades para validación y cálculos de productos
// ============================================================================

import type { CreateProductoDto, UpdateProductoDto } from '@/lib/types/inventario.types';

/**
 * Resultado de validación del formulario
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Calcula el margen de ganancia entre precio de costo y precio de venta
 */
export function calcularMargen(precioCosto: number, precioVenta: number): number {
  if (precioCosto === 0) return 0;
  return ((precioVenta - precioCosto) / precioCosto) * 100;
}

/**
 * Calcula la ganancia absoluta
 */
export function calcularGanancia(precioCosto: number, precioVenta: number): number {
  return precioVenta - precioCosto;
}

/**
 * Valida los datos del formulario de producto
 */
export function validateProductoForm(
  formData: CreateProductoDto | UpdateProductoDto
): ValidationResult {
  // Validar nombre
  if (!formData.nombre?.trim()) {
    return {
      isValid: false,
      error: 'El nombre es requerido',
    };
  }

  if (formData.nombre.length > 200) {
    return {
      isValid: false,
      error: 'El nombre no puede exceder 200 caracteres',
    };
  }

  // Validar categoría
  if (!formData.categoriaId) {
    return {
      isValid: false,
      error: 'Debes seleccionar una categoría',
    };
  }

  // Validar precio de costo
  if ((formData.precioCosto ?? 0) <= 0) {
    return {
      isValid: false,
      error: 'El precio de costo debe ser mayor a 0',
    };
  }

  // Validar precio de venta
  if ((formData.precioVenta ?? 0) < (formData.precioCosto ?? 0)) {
    return {
      isValid: false,
      error: 'El precio de venta no puede ser menor al precio de costo',
    };
  }

  // Validar stock
  if ((formData.stockActual ?? -1) < 0) {
    return {
      isValid: false,
      error: 'El stock no puede ser negativo',
    };
  }

  // Validar stock mínimo
  if ((formData.stockMinimo ?? -1) < 0) {
    return {
      isValid: false,
      error: 'El stock mínimo no puede ser negativo',
    };
  }

  // Validar código de barras si se proporciona
  if (formData.codigoBarras && formData.codigoBarras.length > 50) {
    return {
      isValid: false,
      error: 'El código de barras no puede exceder 50 caracteres',
    };
  }

  return { isValid: true };
}

/**
 * Normaliza los datos del formulario antes de enviar al backend
 */
export function normalizeProductoDto(formData: CreateProductoDto): CreateProductoDto;
export function normalizeProductoDto(formData: UpdateProductoDto): UpdateProductoDto;
export function normalizeProductoDto(
  formData: CreateProductoDto | UpdateProductoDto
): CreateProductoDto | UpdateProductoDto {
  const codigoBarras = formData.codigoBarras?.trim() || undefined;
  const nombre = formData.nombre?.trim();
  
  // Para CreateProductoDto, nombre es requerido
  if ('nombre' in formData && nombre) {
    return {
      ...formData,
      codigoBarras,
      nombre,
    } as CreateProductoDto;
  }
  
  // Para UpdateProductoDto, todos los campos son opcionales
  return {
    ...formData,
    codigoBarras,
    ...(nombre ? { nombre } : {}),
  } as UpdateProductoDto;
}

/**
 * Crea un DTO inicial vacío para el formulario de producto
 */
export function createEmptyProductoDto(): CreateProductoDto {
  return {
    codigoBarras: '',
    nombre: '',
    precioCosto: 0,
    precioVenta: 0,
    stockActual: 0,
    stockMinimo: 5,
    categoriaId: '',
  };
}
