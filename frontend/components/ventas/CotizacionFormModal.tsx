'use client';

// ============================================================================
// COTIZACION FORM MODAL - Formulario para Crear Cotizaciones
// ============================================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, FileText, AlertCircle, User, Printer } from 'lucide-react';
import { useVentas } from '@/contexts/VentasContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCarrito } from '@/hooks/useCarrito';
import { useBusquedaProductos } from '@/hooks/useBusquedaProductos';
import {
  TipoTercero,
  type CrearCotizacionDto,
  type ActualizarCotizacionDto,
  type TerceroResponseDto,
  type DetalleCotizacionResponseDto,
} from '@/lib/types/ventas.types';
import type { Producto } from '@/lib/types/inventario.types';
import { formatCurrency } from '@/lib/utils/format.utils';
import { validateArrayNotEmpty } from '@/lib/utils/validation.utils';
import { ProductSearchInput } from './ProductSearchInput';
import { CarritoList } from './CarritoList';
import { ComprobanteCotizacion } from './ComprobanteCotizacion';

interface CotizacionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  cotizacionId?: string;
}

interface FormErrors {
  general?: string;
  items?: string;
  cliente?: string;
}

export function CotizacionFormModal({ isOpen, onClose, onSuccess, cotizacionId }: CotizacionFormModalProps) {
  const { isAuthenticated, user } = useAuth();
  const { crearCotizacion, actualizarCotizacion, fetchCotizacionById, fetchTerceros, loading } = useVentas();

  // Ref para el comprobante
  const comprobanteRef = useRef<HTMLDivElement>(null);

  // Custom Hooks
  const {
    carrito,
    agregarProducto,
    actualizarCantidad,
    eliminarProducto,
    limpiarCarrito,
    calcularTotal,
    obtenerItemsCotizacion,
  } = useCarrito();

  const busqueda = useBusquedaProductos();

  // Estados de cliente
  const [tipoCliente, setTipoCliente] = useState<'sistema' | 'anonimo'>('sistema');
  const [clienteId, setClienteId] = useState<string>('');
  const [clienteNombreAnonimo, setClienteNombreAnonimo] = useState<string>('');
  const [clientes, setClientes] = useState<TerceroResponseDto[]>([]);

  // Estado de fecha de emisión
  const [fechaEmision, setFechaEmision] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Estados de formulario
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCotizacion, setIsLoadingCotizacion] = useState(false);

  // Estado para datos completos de la cotización (para impresión)
  const [cotizacionCompleta, setCotizacionCompleta] = useState<DetalleCotizacionResponseDto | null>(null);

  // Determinar si estamos en modo edición
  const isEditMode = Boolean(cotizacionId);

  // Memoizar cálculos
  const total = useMemo(() => calcularTotal(), [calcularTotal]);

  // Calcular fecha de vencimiento (fecha emisión + 15 días)
  const fechaVencimiento = useMemo(() => {
    const fecha = new Date(fechaEmision);
    fecha.setDate(fecha.getDate() + 15);
    return fecha;
  }, [fechaEmision]);

  // Obtener nombre del cliente para impresión
  const clienteNombreParaImprimir = useMemo(() => {
    if (tipoCliente === 'anonimo') {
      return clienteNombreAnonimo || 'Cliente Anónimo';
    }
    return clientes.find((c) => c.id === clienteId)?.nombre || 'Sin cliente';
  }, [tipoCliente, clienteNombreAnonimo, clienteId, clientes]);

  // Verificar si se puede imprimir
  const puedeImprimir = useMemo(() => {
    return carrito.length > 0;
  }, [carrito.length]);

  // Cargar clientes al abrir el modal
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    
    let mounted = true;
    
    const initializeForm = async () => {
      await loadClientes();
      
      if (!mounted) return;
      
      if (cotizacionId) {
        await loadCotizacion(cotizacionId);
      } else {
        resetForm();
      }
    };
    
    initializeForm();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAuthenticated, cotizacionId]);

  // ============================================================================
  // FUNCIONES DE CARGA
  // ============================================================================

  const loadClientes = async () => {
    try {
      const response = await fetchTerceros({ tipo: TipoTercero.CLIENTE });
      if (response) {
        setClientes(response);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const loadCotizacion = async (id: string) => {
    setIsLoadingCotizacion(true);
    try {
      const cotizacion = await fetchCotizacionById(id);
      if (cotizacion) {
        // Guardar datos completos para impresión
        setCotizacionCompleta(cotizacion);

        // Establecer datos del cliente
        if (cotizacion.clienteId) {
          setTipoCliente('sistema');
          setClienteId(cotizacion.clienteId);
        } else {
          setTipoCliente('anonimo');
          setClienteNombreAnonimo(cotizacion.clienteNombre);
        }

        // Establecer fecha de emisión
        setFechaEmision(new Date(cotizacion.fechaEmision).toISOString().split('T')[0]);

        // Cargar productos al carrito
        limpiarCarrito();
        cotizacion.items.forEach((item) => {
          const producto: Producto = {
            id: item.productoId,
            nombre: item.nombreProducto,
            precioVenta: item.precioUnitario,
            precioCosto: 0,
            codigoBarras: null,
            stockActual: 999,
            stockMinimo: 0,
            categoriaId: '',
            empresaId: '',
            eliminado: false,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Agregar producto con la cantidad específica
          for (let i = 0; i < item.cantidad; i++) {
            agregarProducto(producto);
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar cotización:', error);
      setFormErrors({ general: 'Error al cargar la cotización' });
    } finally {
      setIsLoadingCotizacion(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAgregarProducto = useCallback(
    (producto: Producto) => {
      const resultado = agregarProducto(producto);
      if (!resultado.success) {
        setFormErrors((prev) => ({ ...prev, items: resultado.mensaje }));
      } else {
        // Limpiar error de items al agregar exitosamente
        setFormErrors((prev) => ({ ...prev, items: undefined }));
      }
      busqueda.limpiarBusqueda();
    },
    [agregarProducto, busqueda]
  );

  const handleSelectCliente = useCallback((clienteIdSelected: string) => {
    setClienteId(clienteIdSelected);
  }, []);

  const handleChangeTipoCliente = (tipo: 'sistema' | 'anonimo') => {
    setTipoCliente(tipo);
    if (tipo === 'anonimo') {
      setClienteId('');
    } else {
      setClienteNombreAnonimo('');
    }
  };

  const handleImprimirCotizacion = useCallback(() => {
    if (!comprobanteRef.current) return;
    
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.error('No se pudo abrir la ventana de impresión');
        return;
      }
      
      const content = comprobanteRef.current.innerHTML;
      
      printWindow.document.write('<!DOCTYPE html>');
      printWindow.document.write('<html><head>');
      printWindow.document.write('<meta charset="utf-8">');
      printWindow.document.write('<title>Cotización</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(content);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        try {
          printWindow.print();
          printWindow.close();
        } catch (err) {
          console.error('Error al imprimir:', err);
        }
      }, 250);
    } catch (error) {
      console.error('Error en handleImprimirCotizacion:', error);
    }
  }, []);

  // ============================================================================
  // VALIDACIONES
  // ============================================================================

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    // Validar que haya productos
    const itemsValidation = validateArrayNotEmpty(carrito, 'El carrito');
    if (!itemsValidation.isValid) {
      errors.items = 'Debes agregar al menos un producto';
    }

    if (tipoCliente === 'anonimo' && !clienteNombreAnonimo.trim()) {
      errors.cliente = 'Debes ingresar el nombre del cliente';
    }

    if (tipoCliente === 'sistema' && !clienteId) {
      errors.cliente = 'Debes seleccionar un cliente';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [carrito, tipoCliente, clienteNombreAnonimo, clienteId]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, onClose]);

  const resetForm = useCallback(() => {
    limpiarCarrito();
    setTipoCliente('sistema');
    setClienteId('');
    setClienteNombreAnonimo('');
    setFechaEmision(new Date().toISOString().split('T')[0]);
    busqueda.limpiarBusqueda();
    setFormErrors({});
  }, [limpiarCarrito, busqueda]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        const items = obtenerItemsCotizacion();

        // Obtener nombre del cliente
        const clienteNombre = tipoCliente === 'anonimo'
          ? clienteNombreAnonimo
          : clientes.find((c) => c.id === clienteId)?.nombre || '';

        if (isEditMode && cotizacionId) {
          // Modo edición - actualizar cotización existente
          const data: ActualizarCotizacionDto = {
            clienteId: tipoCliente === 'sistema' ? clienteId : undefined,
            clienteNombre,
            items,
          };

          console.log('📝 Datos a enviar para actualizar:', { cotizacionId, data });
          const result = await actualizarCotizacion(cotizacionId, data);
          if (result) {
            onSuccess?.();
            handleClose();
          }
        } else {
          // Modo creación - crear nueva cotización
          const data: CrearCotizacionDto = {
            clienteId: tipoCliente === 'sistema' ? clienteId : undefined,
            clienteNombre,
            items,
            fechaEmision: new Date(fechaEmision),
          };

          const result = await crearCotizacion(data);
          if (result) {
            onSuccess?.();
            handleClose();
          }
        }
      } catch (err) {
        console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} cotización:`, err);
        setFormErrors({ general: `Error al ${isEditMode ? 'actualizar' : 'crear'} la cotización` });
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, obtenerItemsCotizacion, tipoCliente, clienteId, clienteNombreAnonimo, clientes, fechaEmision, isEditMode, cotizacionId, actualizarCotizacion, crearCotizacion, onSuccess, handleClose]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => !isSubmitting && handleClose()}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="bg-linear-to-r from-cyan-600 to-cyan-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-white" size={28} aria-hidden="true" />
                <div>
                  <h3 id="modal-title" className="text-xl font-bold text-white">
                    {isEditMode ? 'Editar Cotización' : 'Nueva Cotización'}
                  </h3>
                  <p className="text-sm text-cyan-100">
                    {tipoCliente === 'anonimo' && clienteNombreAnonimo
                      ? clienteNombreAnonimo
                      : tipoCliente === 'sistema' && clienteId
                      ? clientes.find((c) => c.id === clienteId)?.nombre
                      : 'Sin cliente'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg p-1 text-white hover:bg-white/20 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Cerrar modal"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Loading Cotización */}
            {isLoadingCotizacion && (
              <div className="flex items-center justify-center gap-3 p-6 bg-cyan-50 border border-cyan-200 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                <p className="text-cyan-700 font-medium">Cargando cotización...</p>
              </div>
            )}

            {/* Error General */}
            {formErrors.general && (
              <div
                className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3"
                role="alert"
              >
                <AlertCircle className="text-red-600 shrink-0" size={20} aria-hidden="true" />
                <p className="text-sm text-red-800">{formErrors.general}</p>
              </div>
            )}

            {/* Tipo de Cliente */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tipo de Cliente
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleChangeTipoCliente('sistema')}
                  className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    tipoCliente === 'sistema'
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User size={20} className="inline mr-2" />
                  Cliente del Sistema
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeTipoCliente('anonimo')}
                  className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    tipoCliente === 'anonimo'
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User size={20} className="inline mr-2" />
                  Cliente Anónimo
                </button>
              </div>
            </div>

            {/* Selector o Input de Cliente */}
            {tipoCliente === 'sistema' ? (
              <div>
                <label htmlFor="cliente" className="block text-sm font-semibold text-gray-900 mb-2">
                  Cliente
                </label>
                <select
                  id="cliente"
                  value={clienteId}
                  onChange={(e) => handleSelectCliente(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                    formErrors.cliente ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id} className="text-gray-900">
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
                {formErrors.cliente && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.cliente}</p>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="clienteNombre" className="block text-sm font-semibold text-gray-900 mb-2">
                  Nombre del Cliente
                </label>
                <input
                  id="clienteNombre"
                  type="text"
                  value={clienteNombreAnonimo}
                  onChange={(e) => setClienteNombreAnonimo(e.target.value)}
                  placeholder="Ingrese el nombre del cliente..."
                  className={`w-full px-4 py-3 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                    formErrors.cliente ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.cliente && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.cliente}</p>
                )}
              </div>
            )}

            {/* Fecha de Emisión */}
            <div>
              <label htmlFor="fechaEmision" className="block text-sm font-semibold text-gray-900 mb-2">
                Fecha de Emisión
              </label>
              <input
                id="fechaEmision"
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Búsqueda de Productos */}
            <ProductSearchInput
              value={busqueda.termino}
              onChange={busqueda.setTermino}
              productos={busqueda.productos}
              loading={busqueda.loading}
              mostrarResultados={busqueda.mostrarResultados}
              error={busqueda.error || formErrors.items || null}
              onSelectProducto={handleAgregarProducto}
              formatCurrency={formatCurrency}
            />

            {/* Carrito de Productos */}
            {carrito.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg px-6 py-12 text-center">
                <FileText className="mx-auto text-gray-400 mb-3" size={48} aria-hidden="true" />
                <p className="text-gray-600 font-medium">No hay productos agregados</p>
                <p className="text-sm text-gray-500 mt-1">
                  Busca y agrega productos para crear la cotización
                </p>
              </div>
            ) : (
              <CarritoList
                items={carrito}
                onActualizarCantidad={actualizarCantidad}
                onEliminar={eliminarProducto}
                formatCurrency={formatCurrency}
                total={total}
              />
            )}

            {/* Footer: Botones */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>

              {/* Botón Imprimir - Visible cuando hay items en el carrito */}
              {puedeImprimir && (
                <button
                  type="button"
                  onClick={handleImprimirCotizacion}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center gap-2"
                  title={isEditMode ? "Imprimir cotización" : "Vista previa de impresión"}
                >
                  <Printer size={20} />
                  {isEditMode ? 'Imprimir' : 'Vista Previa'}
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || loading || carrito.length === 0}
                className="flex-1 px-4 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {isSubmitting || loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      role="status"
                      aria-label="Procesando"
                    />
                    Procesando...
                  </span>
                ) : (
                  'Guardar Cotización'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Comprobante para Impresión - Hidden */}
      {puedeImprimir && (
        <ComprobanteCotizacion
          ref={comprobanteRef}
          numeroCotizacion={
            isEditMode && cotizacionCompleta
              ? cotizacionCompleta.numeroComprobante
              : 'BORRADOR'
          }
          clienteNombre={clienteNombreParaImprimir}
          items={carrito}
          total={total}
          fechaEmision={new Date(fechaEmision)}
          fechaVencimiento={fechaVencimiento}
          usuarioEmisor={
            isEditMode && cotizacionCompleta
              ? cotizacionCompleta.usuarioEmisor
              : user?.nombre || 'Sistema'
          }
          empresaNombre={user?.razonSocial || 'Mi Empresa'}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}