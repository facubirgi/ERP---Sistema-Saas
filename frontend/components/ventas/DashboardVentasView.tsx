'use client';

// ============================================================================
// DASHBOARD VENTAS VIEW - Vista Principal del Dashboard
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Receipt,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Plus,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useVentas } from '@/contexts/VentasContext';
import { MetricCard } from '@/components/inventario/MetricCard';
import type { VentaListItemDto, TerceroResponseDto } from '@/lib/types/ventas.types';
import { EstadoPago, TipoTercero } from '@/lib/types/ventas.types';
import { formatCurrency, formatDate } from '@/lib/utils/format.utils';
import { ClienteFormModal } from './ClienteFormModal';

interface DashboardVentasViewProps {
  onNavigateToTab: (tabId: string) => void;
  onNavigateToNewVenta: () => void;
}

export function DashboardVentasView({
  onNavigateToTab,
  onNavigateToNewVenta,
}: DashboardVentasViewProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { fetchVentas, fetchTerceros } = useVentas();

  const [recentVentas, setRecentVentas] = useState<VentaListItemDto[]>([]);
  const [clientesConDeuda, setClientesConDeuda] = useState<TerceroResponseDto[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [metricas, setMetricas] = useState({
    totalVentasHoy: 0,
    montoVentasHoy: 0,
    ventasPendienteCobro: 0,
    montoPendienteCobro: 0,
    totalClientes: 0,
    clientesConDeuda: 0,
    ventasDelMes: 0,
    montoDelMes: 0,
  });

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    let mounted = true;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [ventasResponse, tercerosResponse] = await Promise.all([
          fetchVentas(),
          fetchTerceros({ tipo: TipoTercero.CLIENTE }),
        ]);

        if (!mounted) return;

        if (ventasResponse && tercerosResponse) {
          setRecentVentas(ventasResponse.slice(0, 5));
          const conDeuda = tercerosResponse.filter((t) => t.saldoActual > 0);
          setClientesConDeuda(conDeuda.slice(0, 5));
          const metrics = calcularMetricasFromData(ventasResponse, tercerosResponse);
          setMetricas(metrics);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error loading dashboard data:', error);
        }
      } finally {
        if (mounted) {
          setIsLoadingData(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authLoading, fetchVentas, fetchTerceros]);

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  /**
   * Calcula métricas directamente desde los datos recibidos
   * Evita race conditions con el estado del contexto
   */
  const calcularMetricasFromData = (
    ventasData: VentaListItemDto[],
    tercerosData: TerceroResponseDto[]
  ) => {
    const hoy = new Date();
    const añoHoy = hoy.getFullYear();
    const mesHoy = hoy.getMonth();
    const diaHoy = hoy.getDate();

    // Ventas de hoy - Comparación por componentes de fecha
    const ventasHoy = ventasData.filter((v) => {
      const fechaVenta = new Date(v.createdAt);
      return (
        fechaVenta.getFullYear() === añoHoy &&
        fechaVenta.getMonth() === mesHoy &&
        fechaVenta.getDate() === diaHoy
      );
    });

    // Ventas pendientes de cobro
    const ventasPendientes = ventasData.filter(
      (v) => v.estadoPago === EstadoPago.PENDIENTE || v.estadoPago === EstadoPago.PARCIAL
    );

    // Clientes con deuda
    const clientesConDeuda = tercerosData.filter(
      (t) => t.tipo === TipoTercero.CLIENTE && t.saldoActual > 0
    );

    // Ventas del mes actual
    const ventasDelMes = ventasData.filter((v) => {
      const fechaVenta = new Date(v.createdAt);
      return (
        fechaVenta.getFullYear() === añoHoy &&
        fechaVenta.getMonth() === mesHoy
      );
    });

    return {
      totalVentasHoy: ventasHoy.length,
      montoVentasHoy: ventasHoy.reduce((sum, v) => sum + v.total, 0),
      ventasPendienteCobro: ventasPendientes.length,
      montoPendienteCobro: ventasPendientes.reduce((sum, v) => sum + v.saldoPendiente, 0),
      totalClientes: tercerosData.filter((t) => t.tipo === TipoTercero.CLIENTE).length,
      clientesConDeuda: clientesConDeuda.length,
      ventasDelMes: ventasDelMes.length,
      montoDelMes: ventasDelMes.reduce((sum, v) => sum + v.total, 0),
    };
  };

  const loadDashboardData = async () => {
    if (!isAuthenticated || isLoadingData) return;

    setIsLoadingData(true);
    try {
      const [ventasResponse, tercerosResponse] = await Promise.all([
        fetchVentas(),
        fetchTerceros({ tipo: TipoTercero.CLIENTE }),
      ]);

      if (ventasResponse && tercerosResponse) {
        setRecentVentas(ventasResponse.slice(0, 5));
        const conDeuda = tercerosResponse.filter((t) => t.saldoActual > 0);
        setClientesConDeuda(conDeuda.slice(0, 5));
        const metrics = calcularMetricasFromData(ventasResponse, tercerosResponse);
        setMetricas(metrics);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleOpenClienteModal = () => {
    setIsClienteModalOpen(true);
  };

  const handleCloseClienteModal = () => {
    setIsClienteModalOpen(false);
  };

  const handleClienteSuccess = async () => {
    await loadDashboardData();
  };

  // ============================================================================
  // HELPERS DE FORMATO
  // ============================================================================

  const getEstadoPagoColor = (estado: EstadoPago) => {
    switch (estado) {
      case EstadoPago.PAGADO:
        return 'bg-green-100 text-green-800 border-green-200';
      case EstadoPago.PARCIAL:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case EstadoPago.PENDIENTE:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-8">
      {/* Header con botones de acción y debug */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Ventas</h2>
        <div className="flex gap-3">
          <button
            onClick={loadDashboardData}
            disabled={isLoadingData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {isLoadingData ? 'Cargando...' : 'Refrescar'}
          </button>
          <button
            onClick={onNavigateToNewVenta}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Nueva Venta
          </button>
        </div>
      </div>

      {/* Métricas Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Ventas Hoy"
          value={metricas.totalVentasHoy}
          icon={Receipt}
          description={`Total: ${formatCurrency(metricas.montoVentasHoy)}`}
          color="blue"
          onClick={() => onNavigateToTab('ventas')}
        />

        <MetricCard
          title="Pendiente de Cobro"
          value={metricas.ventasPendienteCobro}
          icon={AlertCircle}
          description={`Monto: ${formatCurrency(metricas.montoPendienteCobro)}`}
          color="yellow"
          onClick={() => onNavigateToTab('ventas')}
        />

        <MetricCard
          title="Clientes"
          value={metricas.totalClientes}
          icon={Users}
          description={`${metricas.clientesConDeuda} con deuda`}
          color="purple"
          onClick={() => onNavigateToTab('clientes')}
        />

        <MetricCard
          title="Ventas del Mes"
          value={metricas.ventasDelMes}
          icon={TrendingUp}
          description={`Total: ${formatCurrency(metricas.montoDelMes)}`}
          color="green"
        />
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <h3 className="text-lg font-bold text-gray-900 mb-5">Acciones Rápidas</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onNavigateToNewVenta}
            className="flex items-center justify-between p-5 border-2 border-red-200 rounded-xl hover:border-red-500 bg-linear-to-r from-red-50 to-red-100/30 hover:from-red-100 hover:to-red-200/50 transition-all duration-300 group shadow-sm hover:shadow-lg hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                <Plus className="text-white" size={22} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Nueva Venta</p>
                <p className="text-sm text-gray-600">Registrar una venta</p>
              </div>
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300" size={22} />
          </button>

          <button
            onClick={handleOpenClienteModal}
            className="flex items-center justify-between p-5 border-2 border-purple-200 rounded-xl hover:border-purple-500 bg-linear-to-r from-purple-50 to-purple-100/30 hover:from-purple-100 hover:to-purple-200/50 transition-all duration-300 group shadow-sm hover:shadow-lg hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                <Plus className="text-white" size={22} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Nuevo Cliente</p>
                <p className="text-sm text-gray-600">Agregar cliente</p>
              </div>
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-300" size={22} />
          </button>
        </div>
      </div>

      {/* Ventas Recientes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Ventas Recientes</h3>
          <button
            onClick={() => onNavigateToTab('ventas')}
            className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all duration-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg"
          >
            Ver todas
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {recentVentas.length > 0 ? (
            recentVentas.map((venta) => (
              <div
                key={venta.id}
                className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-100/50 rounded-lg hover:from-red-50 hover:to-red-100/50 border border-gray-200 hover:border-red-300 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Receipt className="text-gray-400" size={18} />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {venta.tercero?.nombre || 'Venta Anónima'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <Calendar className="inline mr-1" size={14} />
                        {formatDate(venta.createdAt)} • {venta.cantidadItems} items
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-3">
                    <p className="font-bold text-gray-900">{formatCurrency(venta.total)}</p>
                    {venta.saldoPendiente > 0 && (
                      <p className="text-sm text-red-600">
                        Pendiente: {formatCurrency(venta.saldoPendiente)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoPagoColor(
                      venta.estadoPago
                    )}`}
                  >
                    {venta.estadoPago}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Receipt className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-sm text-gray-600 font-medium">No hay ventas para mostrar.</p>
              <p className="text-xs text-gray-500 mt-1">Comienza registrando tu primera venta.</p>
            </div>
          )}
        </div>
      </div>

      {/* Clientes con Deuda */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Clientes con Deuda</h3>
          <button
            onClick={() => onNavigateToTab('cuenta-corriente')}
            className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all duration-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg"
          >
            Ver cuenta corriente
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {clientesConDeuda.length > 0 ? (
            clientesConDeuda.map((cliente) => (
              <div
                key={cliente.id}
                className="flex items-center justify-between p-4 bg-linear-to-r from-yellow-50 to-yellow-100/50 rounded-lg hover:from-yellow-100 hover:to-yellow-200/50 border border-yellow-200 hover:border-yellow-300 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Users className="text-yellow-600" size={18} />
                    <div>
                      <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                      {cliente.direccion && (
                        <p className="text-sm text-gray-600 mt-1">{cliente.direccion}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Saldo pendiente</p>
                  <p className="font-bold text-red-600 text-lg">
                    {formatCurrency(cliente.saldoActual)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <DollarSign className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-sm text-gray-600 font-medium">
                ¡Excelente! No hay clientes con deuda pendiente.
              </p>
              <p className="text-xs text-gray-500 mt-1">Todos los pagos están al día.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nuevo Cliente */}
      <ClienteFormModal
        isOpen={isClienteModalOpen}
        onClose={handleCloseClienteModal}
        onSuccess={handleClienteSuccess}
      />
    </div>
  );
}
