'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RegisterDto } from '@/lib/types/auth.types';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Empresa data
    razonSocial: '',
    cuit: '',
    empresaEmail: '',
    // Usuario data
    nombre: '',
    usuarioEmail: '',
    password: '',
    confirmPassword: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const registerData: RegisterDto = {
        empresa: {
          razonSocial: formData.razonSocial,
          cuit: formData.cuit || undefined,
          email: formData.empresaEmail,
        },
        usuario: {
          nombre: formData.nombre,
          email: formData.usuarioEmail,
          password: formData.password,
        },
      };

      await register(registerData);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Registrar Nueva Empresa
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Empresa Section */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Datos de la Empresa
          </h3>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="razonSocial"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Razón Social <span className="text-red-500">*</span>
              </label>
              <input
                id="razonSocial"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="Mi Comercio S.A."
                value={formData.razonSocial}
                onChange={(e) =>
                  setFormData({ ...formData, razonSocial: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="cuit"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                CUIT (opcional)
              </label>
              <input
                id="cuit"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="20-12345678-9"
                value={formData.cuit}
                onChange={(e) =>
                  setFormData({ ...formData, cuit: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="empresaEmail"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Email de la Empresa <span className="text-red-500">*</span>
              </label>
              <input
                id="empresaEmail"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="contacto@micomercio.com"
                value={formData.empresaEmail}
                onChange={(e) =>
                  setFormData({ ...formData, empresaEmail: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Usuario Section */}
        <div className="pt-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Datos del Usuario Propietario
          </h3>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="Juan Pérez"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="usuarioEmail"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Email del Usuario <span className="text-red-500">*</span>
              </label>
              <input
                id="usuarioEmail"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="juan@ejemplo.com"
                value={formData.usuarioEmail}
                onChange={(e) =>
                  setFormData({ ...formData, usuarioEmail: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
        >
          {loading ? 'Registrando...' : 'Registrar Empresa'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
