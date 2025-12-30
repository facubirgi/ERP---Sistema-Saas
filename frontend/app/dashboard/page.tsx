'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Wallet, ShoppingCart, DollarSign, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Datos de ejemplo para los gráficos
const salesData = [
  { day: 'Lun', ventas: 4500 },
  { day: 'Mar', ventas: 5200 },
  { day: 'Mié', ventas: 4800 },
  { day: 'Jue', ventas: 6100 },
  { day: 'Vie', ventas: 7200 },
  { day: 'Sáb', ventas: 8500 },
  { day: 'Dom', ventas: 6800 },
];

const cashFlowData = [
  { day: 'Lun', entradas: 4500, salidas: 2300 },
  { day: 'Mar', entradas: 5200, salidas: 1800 },
  { day: 'Mié', entradas: 4800, salidas: 2100 },
  { day: 'Jue', entradas: 6100, salidas: 2500 },
  { day: 'Vie', entradas: 7200, salidas: 3200 },
  { day: 'Sáb', entradas: 8500, salidas: 2800 },
  { day: 'Dom', entradas: 6800, salidas: 2200 },
];

export default function DashboardPage() {
  const { user } = useAuth();

  // Cálculos de estadísticas
  const totalSales = salesData.reduce((sum, item) => sum + item.ventas, 0);
  const totalCashIn = cashFlowData.reduce((sum, item) => sum + item.entradas, 0);
  const totalCashOut = cashFlowData.reduce((sum, item) => sum + item.salidas, 0);
  const cashBalance = totalCashIn - totalCashOut;

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Total Sales Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalSales.toLocaleString()}
                </p>
                <div className="flex items-center mt-1 text-sm text-green-600">
                  <ArrowUpRight size={16} />
                  <span className="ml-1">12.5% vs semana anterior</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Cash Balance Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo en Caja</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${cashBalance.toLocaleString()}
                </p>
                <div className="flex items-center mt-1 text-sm text-blue-600">
                  <ArrowUpRight size={16} />
                  <span className="ml-1">Balance positivo</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Average Ticket Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(totalSales / 87).toFixed(0)}
                </p>
                <div className="flex items-center mt-1 text-sm text-purple-600">
                  <ArrowUpRight size={16} />
                  <span className="ml-1">87 transacciones</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ventas de la Semana</h3>
              <p className="text-sm text-gray-600">Últimos 7 días</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ventas"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cash Flow Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Flujo de Caja</h3>
              <p className="text-sm text-gray-600">Entradas vs Salidas</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="entradas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Entradas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Salidas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nueva Venta */}
            <button className="group relative overflow-hidden bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg p-6 transition-all duration-200 shadow-md hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h4 className="text-xl font-bold mb-1">Nueva Venta</h4>
                  <p className="text-green-100 text-sm">Registrar una nueva transacción</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                  <ShoppingCart size={28} />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mb-16 -mr-16"></div>
            </button>

            {/* Abrir Caja */}
            <button className="group relative overflow-hidden bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg p-6 transition-all duration-200 shadow-md hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h4 className="text-xl font-bold mb-1">Gestionar Caja</h4>
                  <p className="text-blue-100 text-sm">Abrir/cerrar caja, movimientos</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                  <Wallet size={28} />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mb-16 -mr-16"></div>
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
