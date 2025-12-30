'use client';

// ============================================================================
// CLIENTES VIEW - Vista de Gestión de Terceros (Clientes y Proveedores)
// ============================================================================

import { useState, useEffect } from 'react';
import { Users, Search, Plus, MapPin, Edit, UserCheck, Truck } from 'lucide-react';
import { useVentas } from '@/contexts/VentasContext';
import { useAuth } from '@/contexts/AuthContext';
import { TipoTercero, type TerceroResponseDto } from '@/lib/types/ventas.types';
import { formatCurrency } from '@/lib/utils/format.utils';
import { ClienteFormModal } from './ClienteFormModal';

type FiltroTipo = 'TODOS' | TipoTercero.CLIENTE | TipoTercero.PROVEEDOR;

export function ClientesView() {
  const { isAuthenticated } = useAuth();
  const { fetchTerceros } = useVentas();
  const [clientes, setClientes] = useState<TerceroResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<TerceroResponseDto | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('TODOS');

  useEffect(() => {
    if (!isAuthenticated) return;
    
    let mounted = true;
    
    const fetchData = async () => {
      const query = filtroTipo === 'TODOS' ? {} : { tipo: filtroTipo as TipoTercero };
      const response = await fetchTerceros(query);
      if (response && mounted) {
        setClientes(response);
      }
    };
    
    setLoading(true);
    fetchData().finally(() => {
      if (mounted) setLoading(false);
    });
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, filtroTipo, fetchTerceros]);

  const loadClientes = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const query = filtroTipo === 'TODOS' ? {} : { tipo: filtroTipo as TipoTercero };
      const response = await fetchTerceros(query);
      if (response) {
        setClientes(response);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cliente?: TerceroResponseDto) => {
    setSelectedCliente(cliente || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCliente(null);
  };

  const handleSuccess = async () => {
    await loadClientes();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Gestión de Terceros</h3>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Tercero
          </button>
        </div>

        {/* Tabs de Filtro */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFiltroTipo('TODOS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroTipo === 'TODOS'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={18} />
            Todos ({clientes.length})
          </button>
          <button
            onClick={() => setFiltroTipo(TipoTercero.CLIENTE)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroTipo === TipoTercero.CLIENTE
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <UserCheck size={18} />
            Clientes
          </button>
          <button
            onClick={() => setFiltroTipo(TipoTercero.PROVEEDOR)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroTipo === TipoTercero.PROVEEDOR
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Truck size={18} />
            Proveedores
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando clientes...</p>
          </div>
        ) : clientes.length > 0 ? (
          clientes.map((cliente) => {
            const isCliente = cliente.tipo === TipoTercero.CLIENTE;
            const bgColor = isCliente ? 'from-purple-500 to-purple-600' : 'from-blue-500 to-blue-600';
            const borderHover = isCliente ? 'hover:border-purple-300' : 'hover:border-blue-300';
            const Icon = isCliente ? UserCheck : Truck;
            const tipoLabel = isCliente ? 'Cliente' : 'Proveedor';
            const badgeBg = isCliente ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';

            return (
              <div
                key={cliente.id}
                className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 ${borderHover} relative group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-linear-to-br ${bgColor} rounded-full flex items-center justify-center`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{cliente.nombre}</h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeBg}`}>
                        {tipoLabel}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenModal(cliente)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title={`Editar ${tipoLabel.toLowerCase()}`}
                  >
                    <Edit size={18} />
                  </button>
                </div>

                {cliente.direccion && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                    <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <p>{cliente.direccion}</p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Saldo pendiente</span>
                    <span
                      className={`font-bold text-lg ${
                        cliente.saldoActual > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(cliente.saldoActual)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filtroTipo === 'TODOS'
                ? 'No hay terceros registrados'
                : filtroTipo === TipoTercero.CLIENTE
                ? 'No hay clientes registrados'
                : 'No hay proveedores registrados'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filtroTipo === 'TODOS'
                ? 'Agrega tu primer tercero para comenzar'
                : filtroTipo === TipoTercero.CLIENTE
                ? 'Agrega tu primer cliente para comenzar'
                : 'Agrega tu primer proveedor para comenzar'}
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Agregar Tercero
            </button>
          </div>
        )}
      </div>

      {/* Modal de Formulario */}
      <ClienteFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        cliente={selectedCliente}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
