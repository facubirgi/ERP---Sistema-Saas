'use client';

// ============================================================================
// VENTAS VIEW - Vista de Lista de Ventas
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Receipt, Search, Filter, Calendar, DollarSign, X } from 'lucide-react';
import { useVentas } from '@/contexts/VentasContext';
import { useAuth } from '@/contexts/AuthContext';
import type { VentaListItemDto, EstadoPago } from '@/lib/types/ventas.types';
import { formatCurrency, formatDate } from '@/lib/utils/format.utils';
import { VentaFormModal } from './VentaFormModal';
import { CobroFormModal } from './CobroFormModal';

interface Filtros {
  fechaDesde: string;
  fechaHasta: string;
  estadoPago: EstadoPago | '';
}

export function VentasView() {
  const { isAuthenticated } = useAuth();
  const { fetchVentas } = useVentas();
  const [ventas, setVentas] = useState<VentaListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaListItemDto | null>(null);
  const [isFiltrosOpen, setIsFiltrosOpen] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [filtros, setFiltros] = useState<Filtros>({
    fechaDesde: '',
    fechaHasta: '',
    estadoPago: '',
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState<Filtros>({
    fechaDesde: '',
    fechaHasta: '',
    estadoPago: '',
  });

  // Función helper para ordenar ventas por prioridad de estado
  const ordenarVentasPorEstado = useCallback((ventas: VentaListItemDto[]): VentaListItemDto[] => {
    const prioridades: Record<EstadoPago, number> = {
      PENDIENTE: 1,
      PARCIAL: 2,
      PAGADO: 3,
    };

    return [...ventas].sort((a, b) => {
      const prioridadA = prioridades[a.estadoPago];
      const prioridadB = prioridades[b.estadoPago];

      // Ordenar por prioridad
      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }

      // Si tienen la misma prioridad, ordenar por fecha (más reciente primero)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, []);

  // Aplicar filtros a las ventas
  const aplicarFiltros = useCallback((ventas: VentaListItemDto[], filtros: Filtros): VentaListItemDto[] => {
    return ventas.filter((venta) => {
      // Filtro por fecha desde
      if (filtros.fechaDesde) {
        const fechaVenta = new Date(venta.createdAt);
        const fechaDesde = new Date(filtros.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);
        if (fechaVenta < fechaDesde) return false;
      }

      // Filtro por fecha hasta
      if (filtros.fechaHasta) {
        const fechaVenta = new Date(venta.createdAt);
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        if (fechaVenta > fechaHasta) return false;
      }

      // Filtro por estado
      if (filtros.estadoPago && venta.estadoPago !== filtros.estadoPago) {
        return false;
      }

      return true;
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      const response = await fetchVentas();
      if (response && mounted) {
        const ventasFiltradas = aplicarFiltros(response, filtrosAplicados);
        const ventasOrdenadas = ordenarVentasPorEstado(ventasFiltradas);
        setVentas(ventasOrdenadas);
      }
      if (mounted) setLoading(false);
    };

    fetchData();

    return () => {
      mounted = false;
    };
    // Las funciones aplicarFiltros y ordenarVentasPorEstado son useCallback estables incluidos como dependencias
  }, [isAuthenticated, filtrosAplicados, fetchVentas, aplicarFiltros, ordenarVentasPorEstado]);

  const loadVentas = async () => {
    setLoading(true);
    const response = await fetchVentas();
    if (response) {
      const ventasFiltradas = aplicarFiltros(response, filtrosAplicados);
      const ventasOrdenadas = ordenarVentasPorEstado(ventasFiltradas);
      setVentas(ventasOrdenadas);
    }
    setLoading(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = async () => {
    await loadVentas();
  };

  const handleOpenCobroModal = (venta: VentaListItemDto) => {
    setVentaSeleccionada(venta);
    setIsCobroModalOpen(true);
  };

  const handleCloseCobroModal = () => {
    setIsCobroModalOpen(false);
    setVentaSeleccionada(null);
  };

  const handleCobroSuccess = async () => {
    await loadVentas();
  };

  const handleOpenFiltros = () => {
    setIsFiltrosOpen(true);
  };

  const handleCloseFiltros = () => {
    setIsFiltrosOpen(false);
    // Resetear filtros temporales a los aplicados
    setFiltros(filtrosAplicados);
  };

  const handleAplicarFiltros = () => {
    setFiltrosAplicados(filtros);
    setIsFiltrosOpen(false);
    // Recargar ventas con los nuevos filtros se hace automáticamente por el useEffect
  };

  const handleLimpiarFiltros = () => {
    const filtrosVacios: Filtros = {
      fechaDesde: '',
      fechaHasta: '',
      estadoPago: '',
    };
    setFiltros(filtrosVacios);
    setFiltrosAplicados(filtrosVacios);
    setIsFiltrosOpen(false);
  };

  const handleChangeFiltro = (campo: keyof Filtros, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const tieneFiltrosActivos = (): boolean => {
    return !!(filtrosAplicados.fechaDesde || filtrosAplicados.fechaHasta || filtrosAplicados.estadoPago);
  };

  // Filtrar ventas por búsqueda de cliente
  const ventasFiltradas = ventas.filter((venta) => {
    if (!busquedaCliente.trim()) return true;
    
    const nombreCliente = venta.tercero?.nombre || '';
    return nombreCliente.toLowerCase().includes(busquedaCliente.toLowerCase());
  });

  // Recargar ventas cuando cambien los filtros aplicados
  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      const response = await fetchVentas();
      if (response && mounted) {
        const ventasFiltradas = aplicarFiltros(response, filtrosAplicados);
        const ventasOrdenadas = ordenarVentasPorEstado(ventasFiltradas);
        setVentas(ventasOrdenadas);
      }
      if (mounted) setLoading(false);
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, filtrosAplicados, fetchVentas, aplicarFiltros, ordenarVentasPorEstado]);

  const getEstadoPagoColor = (estado: EstadoPago) => {
    switch (estado) {
      case 'PAGADO':
        return 'bg-green-100 text-green-800';
      case 'PARCIAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDIENTE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con Búsqueda y Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Lista de Ventas</h3>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nueva Venta
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          <button
            onClick={handleOpenFiltros}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
              tieneFiltrosActivos()
                ? 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={20} />
            Filtros
            {tieneFiltrosActivos() && (
              <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                ✓
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Lista de Ventas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando ventas...</p>
          </div>
        ) : ventasFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Items
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                    Saldo
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ventasFiltradas.map((venta, index) => {
                  // Detectar si hay cambio de estado respecto a la fila anterior
                  const estadoAnterior = index > 0 ? ventasFiltradas.at(index - 1)?.estadoPago : null;
                  const cambioEstado = estadoAnterior && estadoAnterior !== venta.estadoPago;

                  return (
                  <tr
                    key={venta.id}
                    className={`hover:bg-gray-50 transition-colors ${cambioEstado ? 'border-t-2 border-gray-400' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        {formatDate(venta.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {venta.tercero?.nombre || <span className="text-gray-400">Venta Anónima</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {venta.cantidadItems} items
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(venta.total)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {venta.saldoPendiente > 0 ? (
                        <span className="text-red-600 font-medium">
                          {formatCurrency(venta.saldoPendiente)}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoPagoColor(venta.estadoPago)}`}>
                        {venta.estadoPago}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(venta.estadoPago === 'PENDIENTE' || venta.estadoPago === 'PARCIAL') && (
                        <button
                          onClick={() => handleOpenCobroModal(venta)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          title="Registrar cobro"
                        >
                          <DollarSign size={16} />
                          Cobrar
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Receipt className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay ventas registradas</h3>
            <p className="text-gray-600 mb-6">Comienza registrando tu primera venta</p>
            <button
              onClick={handleOpenModal}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Registrar Venta
            </button>
          </div>
        )}
      </div>

      {/* Modal de Nueva Venta */}
      <VentaFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* Modal de Registrar Cobro */}
      <CobroFormModal
        isOpen={isCobroModalOpen}
        onClose={handleCloseCobroModal}
        venta={ventaSeleccionada}
        onSuccess={handleCobroSuccess}
      />

      {/* Modal de Filtros */}
      {isFiltrosOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseFiltros}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
              {/* Header */}
              <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Filtrar Ventas</h3>
                  <button
                    onClick={handleCloseFiltros}
                    className="rounded-lg p-1 text-white hover:bg-white/20 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className="mt-1 text-sm text-blue-100">
                  Filtra las ventas por fecha y estado
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-5">
                {/* Filtro por Fecha Desde */}
                <div>
                  <label htmlFor="fechaDesde" className="block text-sm font-semibold text-gray-900 mb-2">
                    Fecha Desde
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <input
                      id="fechaDesde"
                      type="date"
                      value={filtros.fechaDesde}
                      onChange={(e) => handleChangeFiltro('fechaDesde', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Filtro por Fecha Hasta */}
                <div>
                  <label htmlFor="fechaHasta" className="block text-sm font-semibold text-gray-900 mb-2">
                    Fecha Hasta
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <input
                      id="fechaHasta"
                      type="date"
                      value={filtros.fechaHasta}
                      onChange={(e) => handleChangeFiltro('fechaHasta', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Filtro por Estado */}
                <div>
                  <label htmlFor="estadoPago" className="block text-sm font-semibold text-gray-900 mb-2">
                    Estado de Pago
                  </label>
                  <div className="relative">
                    <Filter
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <select
                      id="estadoPago"
                      value={filtros.estadoPago}
                      onChange={(e) => handleChangeFiltro('estadoPago', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white appearance-none cursor-pointer"
                    >
                      <option value="">Todos los estados</option>
                      <option value="PENDIENTE">🔴 Pendiente</option>
                      <option value="PARCIAL">🟡 Parcial</option>
                      <option value="PAGADO">🟢 Pagado</option>
                    </select>
                  </div>
                </div>

                {/* Indicador de resultados */}
                {(filtros.fechaDesde || filtros.fechaHasta || filtros.estadoPago) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium">
                      Filtros seleccionados:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-blue-700">
                      {filtros.fechaDesde && (
                        <li>• Desde: {formatDate(new Date(filtros.fechaDesde))}</li>
                      )}
                      {filtros.fechaHasta && (
                        <li>• Hasta: {formatDate(new Date(filtros.fechaHasta))}</li>
                      )}
                      {filtros.estadoPago && (
                        <li>• Estado: {filtros.estadoPago}</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleLimpiarFiltros}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={handleAplicarFiltros}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
