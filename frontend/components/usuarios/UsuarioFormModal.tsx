'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Shield, AlertCircle } from 'lucide-react';
import type { UsuarioListItem, UpdateUsuarioDto } from '@/lib/types/usuarios.types';
import { UsuarioRol } from '@/lib/types/auth.types';
import type { CreateUsuarioDto } from '@/lib/types/auth.types';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario?: UsuarioListItem | null;
  onSubmit: (data: CreateUsuarioDto | UpdateUsuarioDto) => Promise<boolean>;
}

interface FormData {
  nombre: string;
  email: string;
  password: string;
  rol: UsuarioRol;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  password?: string;
}

export function UsuarioFormModal({
  isOpen,
  onClose,
  usuario,
  onSubmit,
}: UsuarioFormModalProps) {
  const isEditMode = !!usuario;

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    password: '',
    rol: UsuarioRol.EMPLEADO,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (usuario) {
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        password: '',
        rol: usuario.rol,
      });
    } else {
      setFormData({ nombre: '', email: '', password: '', rol: UsuarioRol.EMPLEADO });
    }
    setFormErrors({});
    setApiError(null);
  }, [isOpen, usuario]);

  const validate = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }

    if (!isEditMode) {
      if (!formData.password) {
        errors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (apiError) setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      let data: CreateUsuarioDto | UpdateUsuarioDto;

      if (isEditMode) {
        data = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
        } as UpdateUsuarioDto;
      } else {
        data = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          password: formData.password,
          rol: formData.rol,
        } as CreateUsuarioDto;
      }

      const success = await onSubmit(data);
      if (success) handleClose();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al guardar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isEditMode ? 'Editar Usuario' : 'Nuevo Empleado'}
                </h3>
                <p className="mt-1 text-sm text-indigo-100">
                  {isEditMode
                    ? 'Modificá el nombre o email del usuario'
                    : 'Completá los datos para agregar un empleado'}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg p-1 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {/* Error de API */}
            {apiError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertCircle className="text-red-600 shrink-0" size={20} />
                <p className="text-sm text-red-800">{apiError}</p>
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  maxLength={255}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 placeholder:text-gray-400 ${
                    formErrors.nombre
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {formErrors.nombre && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="empleado@empresa.com"
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 placeholder:text-gray-400 ${
                    formErrors.email
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Password (solo crear) */}
            {!isEditMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 placeholder:text-gray-400 ${
                      formErrors.password
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>
            )}

            {/* Rol (solo crear) */}
            {!isEditMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Rol <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={formData.rol}
                    onChange={(e) => handleChange('rol', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-gray-900 appearance-none"
                  >
                    <option value={UsuarioRol.EMPLEADO}>Empleado</option>
                    <option value={UsuarioRol.DUENO}>Dueño</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Los empleados solo pueden registrar ventas y consultar datos.
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-2">
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
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : isEditMode ? (
                  'Guardar cambios'
                ) : (
                  'Crear empleado'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
