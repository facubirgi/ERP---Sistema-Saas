'use client';

// ============================================================================
// PRODUCTO FORM MODAL - Formulario de Creación/Edición de Producto
// ============================================================================

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/common';
import type { Categoria, CreateProductoDto } from '@/lib/types/inventario.types';

interface ProductoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    formData: CreateProductoDto;
    setFormData: (data: CreateProductoDto) => void;
    categorias: Categoria[];
    mantenerMargen: boolean;
    setMantenerMargen: (value: boolean) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    formErrors: string | null;
    calcularMargen: (costo: number, venta: number) => number;
}

export function ProductoFormModal({
    isOpen,
    onClose,
    title,
    formData,
    setFormData,
    categorias,
    mantenerMargen,
    setMantenerMargen,
    onSubmit,
    isSubmitting,
    formErrors,
    calcularMargen,
}: ProductoFormModalProps) {
    const margen = calcularMargen(formData.precioCosto, formData.precioVenta);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <div className="space-y-6">
                {/* Información Básica */}
                <div className="bg-linear-to-br from-blue-50 to-blue-100/30 p-5 rounded-xl border border-blue-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Información Básica
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Nombre <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 font-medium transition-all duration-200 shadow-sm"
                                placeholder="Ej: Coca Cola 2L"
                                maxLength={200}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Código de Barras
                            </label>
                            <input
                                type="text"
                                value={formData.codigoBarras}
                                onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 font-mono transition-all duration-200 shadow-sm"
                                placeholder="Opcional"
                                maxLength={50}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Categoría <span className="text-red-600">*</span>
                            </label>
                            <select
                                value={formData.categoriaId}
                                onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-gray-900 font-medium transition-all duration-200 shadow-sm"
                            >
                                <option value="">Seleccionar...</option>
                                {categorias.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Precios */}
                <div className="bg-linear-to-br from-green-50 to-green-100/30 p-5 rounded-xl border border-green-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Precios y Margen
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Precio de Costo <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.precioCosto || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || val === null) {
                                          setFormData({ ...formData, precioCosto: 0 });
                                          return;
                                        }
                                        const numVal = parseFloat(val);
                                        setFormData({
                                          ...formData,
                                          precioCosto: isNaN(numVal) ? 0 : numVal
                                        });
                                    }}
                                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 text-gray-900 placeholder:text-gray-400 font-bold transition-all duration-200 shadow-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Precio de Venta <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.precioVenta || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || val === null) {
                                          setFormData({ ...formData, precioVenta: 0 });
                                          return;
                                        }
                                        const numVal = parseFloat(val);
                                        setFormData({
                                          ...formData,
                                          precioVenta: isNaN(numVal) ? 0 : numVal
                                        });
                                    }}
                                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 text-gray-900 placeholder:text-gray-400 font-bold disabled:bg-gray-200 disabled:text-gray-500 transition-all duration-200 shadow-sm"
                                    disabled={mantenerMargen}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between p-4 bg-white rounded-xl border-2 border-green-200 shadow-sm">
                        <div>
                            <p className="text-sm text-gray-700 font-medium">
                                Margen de Ganancia: <span className="font-bold text-green-600 text-lg">{margen.toFixed(1)}%</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Ganancia: <span className="font-bold text-gray-900">${(formData.precioVenta - formData.precioCosto).toFixed(2)}</span>
                            </p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mantenerMargen}
                                onChange={(e) => setMantenerMargen(e.target.checked)}
                                className="w-5 h-5 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-2 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 font-semibold">Mantener margen</span>
                        </label>
                    </div>
                </div>

                {/* Inventario */}
                <div className="bg-linear-to-br from-purple-50 to-purple-100/30 p-5 rounded-xl border border-purple-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                        Inventario
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Stock Actual</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.stockActual || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || val === null) {
                                      setFormData({ ...formData, stockActual: 0 });
                                      return;
                                    }
                                    const numVal = parseInt(val, 10);
                                    setFormData({
                                      ...formData,
                                      stockActual: isNaN(numVal) ? 0 : numVal
                                    });
                                }}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 text-gray-900 placeholder:text-gray-400 font-bold transition-all duration-200 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Stock Mínimo
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.stockMinimo || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || val === null) {
                                      setFormData({ ...formData, stockMinimo: 0 });
                                      return;
                                    }
                                    const numVal = parseInt(val, 10);
                                    setFormData({
                                      ...formData,
                                      stockMinimo: isNaN(numVal) ? 0 : numVal
                                    });
                                }}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 text-gray-900 placeholder:text-gray-400 font-bold transition-all duration-200 shadow-sm"
                            />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 bg-white p-3 rounded-lg border border-purple-200 font-medium">
                        💡 Se te notificará cuando el stock esté por debajo del mínimo
                    </p>
                </div>

                {formErrors && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl shadow-sm">
                        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 font-medium">{formErrors}</p>
                    </div>
                )}

                <ModalFooter>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-3 text-gray-700 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-all duration-200 hover:scale-105"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                        {isSubmitting ? 'Guardando...' : title.includes('Nuevo') ? 'Crear Producto' : 'Guardar Cambios'}
                    </button>
                </ModalFooter>
            </div>
        </Modal>
    );
}
