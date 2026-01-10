'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Wallet, ShoppingCart, DollarSign, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsApi } from '@/lib/api';
import type {
  VentasMensualesResponseDto,
  ComparativaMensualResponseDto,
  CuentasPorCobrarResponseDto,
  StockCriticoResponseDto,
} from '@/lib/types/analytics.types';

export default function DashboardPage() {
  const { user } = useAuth();

  // Estados para los datos del dashboard
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventasMensuales, setVentasMensuales] = useState<VentasMensualesResponseDto | null>(null);
  const [comparativa, setComparativa] = useState<ComparativaMensualResponseDto | null>(null);
  const [cuentasCobrar, setCuentasCobrar] = useState<CuentasPorCobrarResponseDto | null>(null);
  const [stockCritico, setStockCritico] = useState<StockCriticoResponseDto | null>(null);

  // Cargar datos del dashboard
  useEffect(() => {
    const cargarMetricas = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar todas las métricas en paralelo
        const [ventasData, comparativaData, cuentasData, stockData] = await Promise.all([
          AnalyticsApi.getVentasMensuales(12),
          AnalyticsApi.getComparativaMensual(),
          AnalyticsApi.getCuentasPorCobrar(5, false),
          AnalyticsApi.getStockCritico(10, 'deficit'),
        ]);

        setVentasMensuales(ventasData);
        setComparativa(comparativaData);
        setCuentasCobrar(cuentasData);
        setStockCritico(stockData);
      } catch (err: any) {
        console.error('Error al cargar métricas:', err);
        setError(err.message || 'Error al cargar las métricas del dashboard');
      } finally {
        setLoading(false);
      }
    };

    cargarMetricas();
  }, []);

  // Función para formatear moneda
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Función para formatear variación
  const formatVariacion = (valor: number) => {
    const isPositive = valor >= 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center mt-1 text-sm ${colorClass}`}>
        <Icon size={16} />
        <span className="ml-1">
          {isPositive ? '+' : ''}{valor.toFixed(1)}% vs mes anterior
        </span>
      </div>
    );
  };

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600">Cargando métricas...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Mostrar error si ocurrió
  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold">Error al cargar el dashboard</p>
            <p className="text-red-500 text-sm mt-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-gray-600 mt-1">
            Aquí tienes un resumen de tu negocio
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Ventas Mes Actual Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas Mes Actual</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${formatCurrency(comparativa?.mesActual.metricas.totalVentas || 0)}
                </p>
                {comparativa && formatVariacion(comparativa.variaciones.totalVentas)}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Ticket Promedio Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${formatCurrency(comparativa?.mesActual.metricas.ticketPromedio || 0)}
                </p>
                <div className="flex items-center mt-1 text-sm text-purple-600">
                  <span className="ml-1">
                    {comparativa?.mesActual.metricas.cantidadVentas || 0} transacciones
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          {/* Cuentas por Cobrar Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Cuentas por Cobrar</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${formatCurrency(cuentasCobrar?.totalGeneral || 0)}
                </p>
                <div className="flex items-center mt-1 text-sm text-orange-600">
                  <span className="ml-1">
                    {cuentasCobrar?.cantidadClientes || 0} clientes
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wallet className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          {/* Stock Crítico Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Crítico</p>
                <p className="text-2xl font-bold text-red-600">
                  {stockCritico?.totalProductosCriticos || 0}
                </p>
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertTriangle size={16} />
                  <span className="ml-1">Requieren atención</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Ventas Mensuales Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ventas Mensuales</h3>
              <p className="text-sm text-gray-600">Últimos 12 meses</p>
            </div>
            {ventasMensuales && ventasMensuales.meses.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ventasMensuales.meses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="mesNombre"
                    stroke="#6b7280"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `$${formatCurrency(value)}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No hay datos de ventas disponibles
              </div>
            )}
          </div>

          {/* Clientes Morosos Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Clientes Morosos</h3>
              <p className="text-sm text-gray-600">Top 5 clientes con deuda</p>
            </div>
            {cuentasCobrar && cuentasCobrar.clientesMorosos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Cliente
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Deuda
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Días
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cuentasCobrar.clientesMorosos.map((cliente) => (
                      <tr key={cliente.clienteId} className="hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-900">
                          {cliente.clienteNombre}
                        </td>
                        <td className="py-3 text-sm text-right font-semibold text-red-600">
                          ${formatCurrency(cliente.saldoTotal)}
                        </td>
                        <td className="py-3 text-sm text-right text-gray-600">
                          {cliente.diasVencimiento}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No hay clientes con deuda pendiente
              </div>
            )}
          </div>
        </div>

        {/* Stock Crítico Section */}
        {stockCritico && stockCritico.productos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Productos con Stock Crítico</h3>
              <p className="text-sm text-gray-600">Productos que requieren reposición urgente</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockCritico.productos.slice(0, 6).map((producto) => (
                <div
                  key={producto.id}
                  className="border-2 border-red-200 bg-red-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{producto.nombre}</h4>
                      {producto.categoria && (
                        <p className="text-xs text-gray-600 mt-1">{producto.categoria.nombre}</p>
                      )}
                    </div>
                    <AlertTriangle className="text-red-600 shrink-0" size={20} />
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock actual:</span>
                      <span className="font-semibold text-red-600">{producto.stockActual}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock mínimo:</span>
                      <span className="font-semibold text-gray-900">{producto.stockMinimo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Déficit:</span>
                      <span className="font-semibold text-red-600">{producto.deficit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
