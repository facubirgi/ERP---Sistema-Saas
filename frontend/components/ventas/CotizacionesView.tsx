'use client';

// ============================================================================
// COTIZACIONES VIEW - Vista de Lista de Cotizaciones
// ============================================================================

import { useState, useEffect } from 'react';
import { FileText, Search, Calendar, Trash2, Pencil, ShoppingCart } from 'lucide-react';
import { useVentas } from '@/contexts/VentasContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type { CotizacionListItemDto, MetodoPago } from '@/lib/types/ventas.types';
import { formatCurrency, formatDate } from '@/lib/utils/format.utils';
import { CotizacionFormModal } from './CotizacionFormModal';
import { GenerarVentaModal } from './GenerarVentaModal';
import { useWhatsAppShare } from '@/hooks/useWhatsAppShare';
import { WhatsAppButton } from '@/components/common';
import { CotizacionesApi } from '@/lib/api/cotizaciones.api';

interface CotizacionesViewProps {
  onNavigateToTab?: (tabId: string) => void;
}

export function CotizacionesView({ onNavigateToTab }: CotizacionesViewProps) {
  const { user } = useAuth();
  const { fetchCotizaciones, eliminarCotizacion, fetchCotizacionById } = useVentas();
  const { generarMensajeCotizacion } = useWhatsAppShare();
  const { success, error: showError } = useNotifications();
  const [cotizaciones, setCotizaciones] = useState<CotizacionListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cotizacionIdToEdit, setCotizacionIdToEdit] = useState<string | undefined>(undefined);
  const [cotizacionIdToDelete, setCotizacionIdToDelete] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Estado para modal de generar venta
  const [isGenerarVentaModalOpen, setIsGenerarVentaModalOpen] = useState(false);
  const [cotizacionToConvert, setCotizacionToConvert] = useState<CotizacionListItemDto | null>(null);
  const [generatingVenta, setGeneratingVenta] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    let mounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      const response = await fetchCotizaciones();
      if (response && mounted) {
        const cotizacionesOrdenadas = [...response].sort((a, b) => {
          return new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime();
        });
        setCotizaciones(cotizacionesOrdenadas);
      }
      if (mounted) setLoading(false);
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [user, fetchCotizaciones]);

  const loadCotizaciones = async () => {
    setLoading(true);
    const response = await fetchCotizaciones();
    if (response) {
      // Ordenar por fecha más reciente primero
      const cotizacionesOrdenadas = [...response].sort((a, b) => {
        return new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime();
      });
      setCotizaciones(cotizacionesOrdenadas);
    }
    setLoading(false);
  };

  const handleOpenModal = () => {
    setCotizacionIdToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (id: string) => {
    setCotizacionIdToEdit(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCotizacionIdToEdit(undefined);
  };

  const handleSuccess = async () => {
    await loadCotizaciones();
  };

  const handleOpenDeleteModal = (id: string) => {
    setCotizacionIdToDelete(id);
  };

  const handleCloseDeleteModal = () => {
    setCotizacionIdToDelete(null);
  };

  const handleDeleteCotizacion = async () => {
    if (!cotizacionIdToDelete) return;

    const success = await eliminarCotizacion(cotizacionIdToDelete);
    if (success) {
      handleCloseDeleteModal();
      await loadCotizaciones();
    }
  };

  // Funciones para modal de generar venta
  const handleOpenGenerarVentaModal = (cotizacion: CotizacionListItemDto) => {
    setCotizacionToConvert(cotizacion);
    setIsGenerarVentaModalOpen(true);
  };

  const handleCloseGenerarVentaModal = () => {
    setIsGenerarVentaModalOpen(false);
    setCotizacionToConvert(null);
  };

  const handleGenerarVenta = async (montoPagado: number, metodoPago?: MetodoPago) => {
    if (!cotizacionToConvert) return;

    try {
      setGeneratingVenta(true);

      const response = await CotizacionesApi.generarVenta(cotizacionToConvert.id, {
        montoPagado,
        metodoPago,
      });

      // Mostrar notificación de éxito
      success('Venta generada exitosamente', response.mensaje);

      // Cerrar modal
      handleCloseGenerarVentaModal();

      // Recargar cotizaciones (opcional - la cotización sigue existiendo)
      await loadCotizaciones();

      // Redirigir a tab de ventas
      if (onNavigateToTab) {
        onNavigateToTab('ventas');
      }

    } catch (error: unknown) {
      console.error('Error al generar venta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Por favor, intenta de nuevo.';
      showError('Error al generar venta', errorMessage);
    } finally {
      setGeneratingVenta(false);
    }
  };

  // Función para obtener datos completos de la cotización para el PDF
  const obtenerDatosCotizacionPDF = async (cotizacionId: string): Promise<CotizacionPDFData | null> => {
    try {
      const detalle = await fetchCotizacionById(cotizacionId);
      if (!detalle) return null;

      return {
        numeroComprobante: detalle.numeroComprobante,
        fechaEmision: detalle.fechaEmision,
        fechaVencimiento: detalle.fechaVencimiento,
        clienteNombre: detalle.clienteNombre,
        empresaNombre: detalle.empresaNombre || user?.razonSocial || 'Mi Empresa',
        items: detalle.items.map(item => ({
          nombreProducto: item.nombreProducto,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
        })),
        total: detalle.total,
      };
    } catch (error) {
      console.error('Error al obtener detalles de cotización:', error);
      return null;
    }
  };

  // Filtrar cotizaciones por búsqueda
  const cotizacionesFiltradas = cotizaciones.filter((cot) =>
    cot.clienteNombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header con Búsqueda */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Lista de Cotizaciones</h3>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            + Nueva Cotización
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Cotizaciones */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando cotizaciones...</p>
          </div>
        ) : cotizacionesFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Número
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                    Total
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
                {cotizacionesFiltradas.map((cotizacion) => (
                  <tr
                    key={cotizacion.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-cyan-600">
                      {cotizacion.numeroComprobante}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        {formatDate(cotizacion.fechaEmision)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {cotizacion.clienteNombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(cotizacion.total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cotizacion.convertidaAVenta ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                          Convertida a Venta
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenGenerarVentaModal(cotizacion)}
                          disabled={cotizacion.convertidaAVenta}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            cotizacion.convertidaAVenta
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                          title={cotizacion.convertidaAVenta ? 'Esta cotización ya fue convertida a venta' : 'Generar venta desde esta cotización'}
                        >
                          <ShoppingCart size={16} />
                          Generar Venta
                        </button>
                        <WhatsAppButton
                          mensaje={generarMensajeCotizacion({
                            clienteNombre: cotizacion.clienteNombre,
                            total: cotizacion.total,
                            numeroCotizacion: cotizacion.numeroComprobante,
                            empresaNombre: user?.razonSocial,
                          })}
                          obtenerDatosCotizacion={() => obtenerDatosCotizacionPDF(cotizacion.id)}
                          variant="primary"
                          size="sm"
                        />
                        <button
                          onClick={() => handleOpenEditModal(cotizacion.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
                          title="Editar cotización"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(cotizacion.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                          title="Eliminar cotización"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay cotizaciones registradas</h3>
            <p className="text-gray-600 mb-6">Comienza registrando tu primera cotización</p>
            <button
              onClick={handleOpenModal}
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              + Nueva Cotización
            </button>
          </div>
        )}
      </div>

      {/* Modal de Confirmación para Eliminar */}
      {cotizacionIdToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseDeleteModal}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
              {/* Header */}
              <div className="bg-red-600 px-6 py-5">
                <h3 className="text-xl font-bold text-white">Eliminar Cotización</h3>
                <p className="mt-1 text-sm text-red-100">
                  Esta acción no se puede deshacer
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar esta cotización?
                </p>
              </div>

              {/* Footer: Botones */}
              <div className="flex gap-3 px-6 py-4 bg-gray-50">
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCotizacion}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva/Editar Cotización */}
      <CotizacionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        cotizacionId={cotizacionIdToEdit}
      />

      {/* Modal de Generar Venta */}
      {cotizacionToConvert && (
        <GenerarVentaModal
          isOpen={isGenerarVentaModalOpen}
          onClose={handleCloseGenerarVentaModal}
          onConfirm={handleGenerarVenta}
          totalCotizacion={cotizacionToConvert.total}
          clienteNombre={cotizacionToConvert.clienteNombre}
          loading={generatingVenta}
        />
      )}
    </div>
  );
}