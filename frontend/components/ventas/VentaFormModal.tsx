'use client';

// ============================================================================
// VENTA FORM MODAL - Formulario para Crear Ventas con Sistema de Carrito
// ============================================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, ShoppingCart, AlertCircle, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVentas } from '@/contexts/VentasContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCaja } from '@/hooks/useCaja';
import { useNotifications } from '@/contexts/NotificationContext';
import { useCarrito } from '@/hooks/useCarrito';
import { useBusquedaProductos } from '@/hooks/useBusquedaProductos';
import {
  MetodoPago,
  TipoTercero,
  type CrearVentaDto,
  type TerceroResponseDto,
} from '@/lib/types/ventas.types';
import type { Producto } from '@/lib/types/inventario.types';
import { formatCurrency } from '@/lib/utils/format.utils';
import { validateAmount, validateArrayNotEmpty } from '@/lib/utils/validation.utils';
import { ProductSearchInput } from './ProductSearchInput';
import { CarritoList } from './CarritoList';
import { PaymentSection } from './PaymentSection';
import { ComprobanteVenta } from './ComprobanteVenta';

interface VentaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormErrors {
  general?: string;
  items?: string;
  pago?: string;
}

export function VentaFormModal({ isOpen, onClose, onSuccess }: VentaFormModalProps) {
  const { isAuthenticated } = useAuth();
  const { crearVenta, fetchTerceros, loading } = useVentas();
  const { sesion } = useCaja();
  const { addNotification } = useNotifications();
  const router = useRouter();

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
    obtenerItems,
  } = useCarrito();

  const busqueda = useBusquedaProductos();

  // Estados de cliente
  const [clienteId, setClienteId] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('Venta Anónima');
  const [clientes, setClientes] = useState<TerceroResponseDto[]>([]);

  // Estados de pago
  const [montoPagado, setMontoPagado] = useState<string>('0');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);

  // Estados de formulario
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoizar cálculos
  const total = useMemo(() => calcularTotal(), [calcularTotal]);
  const cambio = useMemo(() => {
    const pagado = parseFloat(montoPagado) || 0;
    return Math.max(0, pagado - total);
  }, [montoPagado, total]);

  // Verificar si se puede imprimir (total === montoPagado)
  const puedeImprimir = useMemo(() => {
    const pagado = parseFloat(montoPagado) || 0;
    return total > 0 && pagado === total && carrito.length > 0;
  }, [total, montoPagado, carrito.length]);

  // Cargar clientes al abrir el modal
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    
    let mounted = true;
    
    const fetchData = async () => {
      await loadClientes();
      if (mounted) {
        resetForm();
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAuthenticated]);

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

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAgregarProducto = useCallback(
    (producto: Producto) => {
      const resultado = agregarProducto(producto);
      if (!resultado.success) {
        setFormErrors({ items: resultado.mensaje });
        setTimeout(() => setFormErrors({}), 3000);
      }
      busqueda.limpiarBusqueda();
    },
    [agregarProducto, busqueda]
  );

  const handleSelectCliente = useCallback((clienteIdSelected: string) => {
    if (clienteIdSelected) {
      setClientes((prevClientes) => {
        const cliente = prevClientes.find((c) => c.id === clienteIdSelected);
        if (cliente) {
          setClienteId(cliente.id);
          setClienteNombre(cliente.nombre);
        }
        return prevClientes;
      });
    } else {
      setClienteId('');
      setClienteNombre('Venta Anónima');
    }
  }, []);

  const handleImprimirComprobante = useCallback(() => {
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
      printWindow.document.write('<title>Comprobante de Venta</title>');
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
      console.error('Error en handleImprimirComprobante:', error);
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

    // Validar monto pagado
    const pagadoValidation = validateAmount(montoPagado);
    
    if (montoPagado && montoPagado !== '0') {
      if (!pagadoValidation.isValid) {
        errors.pago = pagadoValidation.error;
      } else if (pagadoValidation.value! > 0 && !metodoPago) {
        errors.pago = 'Debes seleccionar un método de pago';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [carrito, montoPagado, metodoPago]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Validar que la caja esté abierta
      if (!sesion || sesion.estado !== 'ABIERTA') {
        addNotification({
          type: 'warning',
          title: 'Caja Cerrada',
          message: 'Debes abrir la caja antes de registrar una venta',
          duration: 7000,
          action: {
            label: 'Ir a Caja',
            onClick: () => {
              handleClose();
              router.push('/dashboard/caja');
            },
          },
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const items = obtenerItems();
        const pagado = parseFloat(montoPagado) || 0;

        const data: CrearVentaDto = {
          clienteId: clienteId || undefined,
          items,
          montoPagado: pagado,
          metodoPago: pagado > 0 ? metodoPago : undefined,
        };

        const result = await crearVenta(data);
        if (result) {
          onSuccess?.();
          handleClose();
        }
      } catch (err) {
        console.error('Error al crear venta:', err);
        setFormErrors({ general: 'Error al crear la venta' });
      } finally {
        setIsSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validateForm, obtenerItems, montoPagado, clienteId, metodoPago, crearVenta, onSuccess, sesion, addNotification, router]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, onClose]);

  const resetForm = useCallback(() => {
    limpiarCarrito();
    setClienteId('');
    setClienteNombre('Venta Anónima');
    setMontoPagado('0');
    setMetodoPago(MetodoPago.EFECTIVO);
    busqueda.limpiarBusqueda();
    setFormErrors({});
  }, [limpiarCarrito, busqueda]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
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
          <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="text-white" size={28} aria-hidden="true" />
                <div>
                  <h3 id="modal-title" className="text-xl font-bold text-white">
                    Nueva Venta
                  </h3>
                  <p className="text-sm text-blue-100">{clienteNombre}</p>
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

            {/* Selector de Cliente */}
            <div>
              <label htmlFor="cliente" className="block text-sm font-semibold text-gray-900 mb-2">
                Cliente (opcional)
              </label>
              <select
                id="cliente"
                value={clienteId}
                onChange={(e) => handleSelectCliente(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" className="text-gray-500">Venta Anónima</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id} className="text-gray-900">
                    {cliente.nombre}
                  </option>
                ))}
              </select>
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
            <CarritoList
              items={carrito}
              onActualizarCantidad={actualizarCantidad}
              onEliminar={eliminarProducto}
              formatCurrency={formatCurrency}
              total={total}
            />

            {/* Sección de Pago */}
            <PaymentSection
              montoPagado={montoPagado}
              onMontoPagadoChange={setMontoPagado}
              metodoPago={metodoPago}
              onMetodoPagoChange={setMetodoPago}
              total={total}
              cambio={cambio}
              error={formErrors.pago}
              formatCurrency={formatCurrency}
            />

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
              {puedeImprimir && (
                <button
                  type="button"
                  onClick={handleImprimirComprobante}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center gap-2"
                  aria-label="Imprimir comprobante"
                >
                  <Printer size={20} />
                  Imprimir Comprobante
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || loading || carrito.length === 0}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  'Confirmar Venta'
                )}
              </button>
            </div>
          </form>

          {/* Comprobante (oculto, solo para impresión) */}
          <ComprobanteVenta
            ref={comprobanteRef}
            clienteNombre={clienteNombre}
            items={carrito}
            total={total}
            montoPagado={parseFloat(montoPagado) || 0}
            metodoPago={parseFloat(montoPagado) > 0 ? metodoPago : undefined}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
}
