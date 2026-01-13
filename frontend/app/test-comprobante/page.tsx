'use client';

// Página de prueba para verificar los comprobantes mejorados
import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ComprobanteVenta } from '@/components/ventas/ComprobanteVenta';
import { ComprobanteCotizacion } from '@/components/ventas/ComprobanteCotizacion';
import { MetodoPago } from '@/lib/types/ventas.types';

export default function TestComprobantePage() {
  const { user } = useAuth();
  const ventaRef = useRef<HTMLDivElement>(null);
  const cotizacionRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const itemsPrueba = [
    {
      id: '1',
      productoId: '1',
      nombre: 'Laptop HP Pavilion 15.6" Intel Core i7 16GB RAM',
      cantidad: 2,
      precioUnitario: 5500.00,
      subtotal: 11000.00,
      stock: 10,
      stockDisponible: 10
    },
    {
      id: '2',
      productoId: '2',
      nombre: 'Mouse Inalámbrico Logitech M185',
      cantidad: 5,
      precioUnitario: 45.50,
      subtotal: 227.50,
      stock: 50,
      stockDisponible: 50
    },
    {
      id: '3',
      productoId: '3',
      nombre: 'Teclado Mecánico RGB Gamer',
      cantidad: 1,
      precioUnitario: 320.00,
      subtotal: 320.00,
      stock: 15,
      stockDisponible: 15
    },
  ];

  const handleImprimirVenta = () => {
    if (!ventaRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = ventaRef.current.innerHTML;
    printWindow.document.write('<!DOCTYPE html>');
    printWindow.document.write('<html><head>');
    printWindow.document.write('<meta charset="utf-8">');
    printWindow.document.write('<title>Comprobante de Venta - Prueba</title>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleImprimirCotizacion = () => {
    if (!cotizacionRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = cotizacionRef.current.innerHTML;
    printWindow.document.write('<!DOCTYPE html>');
    printWindow.document.write('<html><head>');
    printWindow.document.write('<meta charset="utf-8">');
    printWindow.document.write('<title>Cotización - Prueba</title>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const total = itemsPrueba.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧪 Prueba de Comprobantes Mejorados
          </h1>
          <p className="text-gray-600 mb-6">
            Verifica las mejoras implementadas en los comprobantes de venta y cotizaciones
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card Comprobante de Venta */}
            <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📄</span>
                Comprobante de Venta
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">✨ Mejoras:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ Items numerados (#1, #2, #3...)</li>
                    <li>✅ Subtotales en negrita</li>
                    <li>✅ Total de unidades vendidas</li>
                    <li>✅ Cálculo automático de vuelto</li>
                    <li>✅ Saldo pendiente destacado</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-gray-700"><strong>Cliente:</strong> Juan Pérez</p>
                  <p className="text-sm text-gray-700"><strong>Items:</strong> {itemsPrueba.length} productos</p>
                  <p className="text-sm text-gray-700"><strong>Total:</strong> {formatCurrency(total)}</p>
                  <p className="text-sm text-gray-700"><strong>Pagado:</strong> {formatCurrency(12000)}</p>
                  <p className="text-sm text-green-600 font-bold"><strong>Vuelto:</strong> {formatCurrency(12000 - total)}</p>
                </div>
              </div>

              <button
                onClick={handleImprimirVenta}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">🖨️</span>
                Imprimir Comprobante de Venta
              </button>
            </div>

            {/* Card Cotización */}
            <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Cotización
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">✨ Mejoras:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ Items numerados (#1, #2, #3...)</li>
                    <li>✅ Formato de tabla mejorado</li>
                    <li>✅ Subtotales destacados</li>
                    <li>✅ Total de unidades</li>
                    <li>✅ Información de validez</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-gray-700"><strong>N°:</strong> COT-0042</p>
                  <p className="text-sm text-gray-700"><strong>Cliente:</strong> María González</p>
                  <p className="text-sm text-gray-700"><strong>Items:</strong> {itemsPrueba.length} productos</p>
                  <p className="text-sm text-gray-700"><strong>Total:</strong> {formatCurrency(total)}</p>
                  <p className="text-sm text-blue-600"><strong>Validez:</strong> 15 días</p>
                </div>
              </div>

              <button
                onClick={handleImprimirCotizacion}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">🖨️</span>
                Imprimir Cotización
              </button>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Instrucciones
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Haz clic en cualquiera de los botones de impresión</li>
              <li>Se abrirá una vista previa del comprobante</li>
              <li>Verás todos los items numerados con sus detalles</li>
              <li>Observa el formato mejorado de tabla</li>
              <li>Nota los subtotales destacados en negrita</li>
              <li>Ve el cálculo automático de vuelto (en la venta)</li>
            </ol>
          </div>
        </div>

        {/* Comprobantes ocultos para impresión */}
        <div style={{ display: 'none' }}>
          <ComprobanteVenta
            ref={ventaRef}
            clienteNombre="Juan Pérez"
            items={itemsPrueba}
            total={total}
            montoPagado={12000}
            metodoPago={MetodoPago.EFECTIVO}
            fecha={new Date()}
            empresaNombre={user?.razonSocial || 'Mi Empresa'}
            formatCurrency={formatCurrency}
          />

          <ComprobanteCotizacion
            ref={cotizacionRef}
            numeroCotizacion="COT-0042"
            clienteNombre="María González"
            items={itemsPrueba}
            total={total}
            fechaEmision={new Date()}
            fechaVencimiento={new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)}
            usuarioEmisor="Admin User"
            empresaNombre={user?.razonSocial || 'Mi Empresa'}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
}
