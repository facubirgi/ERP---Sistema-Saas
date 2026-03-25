'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, Crown, UserPlus, RefreshCw } from 'lucide-react';
import { ConfirmDialog } from '@/components/common';
import { TenantApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type { UsuarioListItem, EstadisticasUsuarios, UpdateUsuarioDto } from '@/lib/types/usuarios.types';
import type { CreateUsuarioDto } from '@/lib/types/auth.types';
import { UsuariosTable } from './UsuariosTable';
import { UsuarioFormModal } from './UsuarioFormModal';
import { CambiarPasswordModal } from './CambiarPasswordModal';

export function DashboardUsuariosView() {
  const { user, isOwner } = useAuth();
  const { success, error: notifyError } = useNotifications();

  // Datos (solo cargados si es dueño)
  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuarios | null>(null);
  const [loading, setLoading] = useState(isOwner);

  // Modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioListItem | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const cargarDatos = useCallback(async () => {
    if (!isOwner) return;
    setLoading(true);
    try {
      const [listaUsuarios, stats] = await Promise.all([
        TenantApi.getUsuarios(),
        TenantApi.getEstadisticas(),
      ]);
      setUsuarios(listaUsuarios);
      setEstadisticas(stats);
    } catch {
      notifyError('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [isOwner, notifyError]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // --- Handlers de formulario ---
  const handleOpenCreate = () => {
    setSelectedUsuario(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (usuario: UsuarioListItem) => {
    setSelectedUsuario(usuario);
    setFormModalOpen(true);
  };

  const handleSubmitForm = async (data: CreateUsuarioDto | UpdateUsuarioDto): Promise<boolean> => {
    try {
      if (selectedUsuario) {
        await TenantApi.updateUsuario(selectedUsuario.id, data as UpdateUsuarioDto);
        success('Usuario actualizado', `Los datos de ${selectedUsuario.nombre} fueron actualizados`);
      } else {
        const resp = await TenantApi.createUsuario(data as CreateUsuarioDto);
        success('Usuario creado', `El empleado ${resp.usuario.nombre} fue creado exitosamente`);
      }
      if (isOwner) await cargarDatos();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el usuario';
      notifyError('Error', msg);
      throw err;
    }
  };

  // --- Handler de cambio de contraseña ---
  const handleOpenPassword = (usuario: UsuarioListItem) => {
    setSelectedUsuario(usuario);
    setPasswordModalOpen(true);
  };

  const handleSubmitPassword = async (id: string, nuevaPassword: string): Promise<boolean> => {
    try {
      await TenantApi.cambiarPassword(id, { nuevaPassword });
      success('Contraseña cambiada', 'La contraseña fue actualizada correctamente');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar la contraseña';
      notifyError('Error', msg);
      throw err;
    }
  };

  // --- Handler de toggle activo ---
  const handleOpenToggle = (usuario: UsuarioListItem) => {
    setSelectedUsuario(usuario);
    setConfirmToggleOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedUsuario) return;
    setToggleLoading(true);
    try {
      const updated = await TenantApi.toggleActivo(selectedUsuario.id);
      success(
        updated.activo ? 'Usuario activado' : 'Usuario desactivado',
        `${selectedUsuario.nombre} fue ${updated.activo ? 'activado' : 'desactivado'}`
      );
      await cargarDatos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar el estado';
      notifyError('Error', msg);
    } finally {
      setToggleLoading(false);
      setConfirmToggleOpen(false);
      setSelectedUsuario(null);
    }
  };

  // ── Vista para EMPLEADO: solo crear usuario ──────────────────────────────
  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agregar Usuario</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registrá un nuevo empleado en el sistema
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col items-center gap-4 max-w-sm">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <UserPlus className="text-indigo-600" size={28} />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-medium">Crear nuevo empleado</p>
            <p className="text-sm text-gray-500 mt-1">
              Completá el formulario para dar acceso a un nuevo usuario
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
          >
            <UserPlus size={18} />
            Nuevo empleado
          </button>
        </div>

        <UsuarioFormModal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          usuario={null}
          onSubmit={handleSubmitForm}
        />
      </div>
    );
  }

  // ── Vista para DUEÑO: gestión completa ───────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administrá los empleados y sus accesos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Recargar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
          >
            <UserPlus size={18} />
            Nuevo empleado
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total activos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total activos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '—' : (estadisticas?.totalActivos ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users className="text-indigo-600" size={24} />
            </div>
          </div>
        </div>

        {/* Dueños */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Dueños</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '—' : (estadisticas?.duenos ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Crown className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Empleados */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Empleados</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '—' : (estadisticas?.empleados ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Todos los usuarios
          </h2>
        </div>
        <div className="p-4">
          <UsuariosTable
            usuarios={usuarios}
            loading={loading}
            onEdit={handleOpenEdit}
            onCambiarPassword={handleOpenPassword}
            onToggleActivo={handleOpenToggle}
            currentUserId={user?.userId}
          />
        </div>
      </div>

      {/* Modal crear/editar */}
      <UsuarioFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedUsuario(null);
        }}
        usuario={selectedUsuario}
        onSubmit={handleSubmitForm}
      />

      {/* Modal cambiar contraseña */}
      <CambiarPasswordModal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setSelectedUsuario(null);
        }}
        usuario={selectedUsuario}
        onSubmit={handleSubmitPassword}
      />

      {/* Confirm toggle activo */}
      <ConfirmDialog
        isOpen={confirmToggleOpen}
        onClose={() => {
          setConfirmToggleOpen(false);
          setSelectedUsuario(null);
        }}
        onConfirm={handleConfirmToggle}
        title={selectedUsuario?.activo ? 'Desactivar usuario' : 'Activar usuario'}
        message={
          selectedUsuario?.activo
            ? `¿Desactivar a ${selectedUsuario?.nombre}? No podrá iniciar sesión hasta que lo reactives.`
            : `¿Activar a ${selectedUsuario?.nombre}? Podrá iniciar sesión nuevamente.`
        }
        confirmText={selectedUsuario?.activo ? 'Desactivar' : 'Activar'}
        variant={selectedUsuario?.activo ? 'danger' : 'warning'}
        loading={toggleLoading}
      />
    </div>
  );
}
