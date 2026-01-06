'use client';

// ============================================================================
// CUENTA CORRIENTE VIEW - Vista de Deudas y Saldos Pendientes
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { FileText, Users, DollarSign, AlertCircle } from 'lucide-react';
import { useVentas } from '@/contexts/VentasContext';
import { useAuth } from '@/contexts/AuthContext';
import { TipoTercero, type TerceroResponseDto } from '@/lib/types/ventas.types';
import { formatCurrency } from '@/lib/utils/format.utils';

export function CuentaCorrienteView() {
  const { isAuthenticated } = useAuth();
  const { fetchTerceros } = useVentas();
  const [clientesConDeuda, setClientesConDeuda] = useState<TerceroResponseDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Calcular deuda total
  const totalDeuda = useMemo(() => {
    return clientesConDeuda.reduce((total, cliente) => total + cliente.saldoActual, 0);
  }, [clientesConDeuda]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    let mounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      const response = await fetchTerceros({ tipo: TipoTercero.CLIENTE });
      if (response && mounted) {
        const conDeuda = response.filter((c) => c.saldoActual > 0);
        setClientesConDeuda(conDeuda);
      }
      if (mounted) setLoading(false);
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, fetchTerceros]);

  return (
    <div className="space-y-6">
      {/* Header con Resumen */}
      <div className="bg-linear-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cuenta Corriente</h3>
            <p className="text-gray-600">Clientes con saldo pendiente</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Deuda Total</p>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(totalDeuda)}</p>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Clientes con deuda</p>
              <p className="text-2xl font-bold text-gray-900">{clientesConDeuda.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <DollarSign className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Deuda promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {clientesConDeuda.length > 0
                  ? formatCurrency(totalDeuda / clientesConDeuda.length)
                  : '$0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mayor deuda</p>
              <p className="text-2xl font-bold text-gray-900">
                {clientesConDeuda.length > 0
                  ? formatCurrency(Math.max(...clientesConDeuda.map((c) => c.saldoActual)))
                  : '$0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Clientes con Deuda */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando cuenta corriente...</p>
          </div>
        ) : clientesConDeuda.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Dirección
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                    Saldo Pendiente
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clientesConDeuda.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                          <Users className="text-white" size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                          <p className="text-xs text-gray-500">ID: {cliente.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {cliente.direccion || <span className="text-gray-400">Sin dirección</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(cliente.saldoActual)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold">
                        Registrar Cobro
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Excelente! No hay deudas pendientes
            </h3>
            <p className="text-gray-600">Todos los clientes están al día con sus pagos</p>
          </div>
        )}
      </div>
    </div>
  );
}
