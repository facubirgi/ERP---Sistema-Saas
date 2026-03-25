'use client';

import { Table, Column, Badge } from '@/components/common';
import { Pencil, KeyRound, UserCheck, UserX } from 'lucide-react';
import type { UsuarioListItem } from '@/lib/types/usuarios.types';
import { UsuarioRol } from '@/lib/types/auth.types';

interface UsuariosTableProps {
  usuarios: UsuarioListItem[];
  loading: boolean;
  onEdit: (usuario: UsuarioListItem) => void;
  onCambiarPassword: (usuario: UsuarioListItem) => void;
  onToggleActivo: (usuario: UsuarioListItem) => void;
  currentUserId?: number;
}

export function UsuariosTable({
  usuarios,
  loading,
  onEdit,
  onCambiarPassword,
  onToggleActivo,
  currentUserId,
}: UsuariosTableProps) {
  const columns: Column<UsuarioListItem>[] = [
    {
      key: 'nombre',
      header: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-semibold">
              {u.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{u.nombre}</p>
            <p className="text-xs text-gray-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (u) => (
        <Badge variant={u.rol === UsuarioRol.DUENO ? 'primary' : 'info'}>
          {u.rol === UsuarioRol.DUENO ? 'Dueno' : 'Empleado'}
        </Badge>
      ),
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (u) => (
        <Badge variant={u.activo ? 'success' : 'danger'}>
          {u.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha de registro',
      render: (u) => (
        <span className="text-sm text-gray-600">
          {new Date(u.createdAt).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-right',
      render: (u) => {
        const esMismoUsuario = currentUserId !== undefined && String(currentUserId) === String(u.id);

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onEdit(u)}
              className="p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all duration-200"
              title="Editar usuario"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onCambiarPassword(u)}
              className="p-2 text-gray-600 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-all duration-200"
              title="Cambiar contrasena"
            >
              <KeyRound size={16} />
            </button>
            {!esMismoUsuario && (
              <button
                onClick={() => onToggleActivo(u)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  u.activo
                    ? 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                }`}
                title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
              >
                {u.activo ? <UserX size={16} /> : <UserCheck size={16} />}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={usuarios}
      keyExtractor={(u) => u.id}
      loading={loading}
      emptyMessage="No hay usuarios registrados"
    />
  );
}
