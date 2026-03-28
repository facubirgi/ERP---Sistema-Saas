'use client';

// ============================================================================
// COMPROBANTE VENTA - Componente para generar comprobante imprimible
// ============================================================================

import { forwardRef } from 'react';
import type { CarritoItem } from '@/hooks/useCarrito';
import { MetodoPago } from '@/lib/types/ventas.types';

interface ComprobanteVentaProps {
  clienteNombre: string;
  items: CarritoItem[];
  total: number;
  montoPagado: number;
  metodoPago?: MetodoPago;
  fecha?: Date;
  empresaNombre?: string;
  formatCurrency: (value: number) => string;
}

export const ComprobanteVenta = forwardRef<HTMLDivElement, ComprobanteVentaProps>(
  ({ clienteNombre, items, total, montoPagado, metodoPago, fecha = new Date(), empresaNombre = 'Mi Empresa', formatCurrency }, ref) => {
    const formatearFecha = (fecha: Date) => {
      return fecha.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    };

    const metodoPagoLabel = {
      [MetodoPago.EFECTIVO]: 'Efectivo',
      [MetodoPago.QR]: 'QR',
      [MetodoPago.TARJETA]: 'Tarjeta',
      [MetodoPago.TRANSFERENCIA]: 'Transferencia',
    };

    const baseStyle: React.CSSProperties = {
      width: '72mm',
      padding: '4mm',
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: '10pt',
      color: '#000',
      background: '#fff',
      boxSizing: 'border-box',
    };

    const headerStyle: React.CSSProperties = {
      textAlign: 'center',
      borderBottom: '1px dashed #000',
      paddingBottom: '8px',
      marginBottom: '8px',
    };

    const infoSectionStyle: React.CSSProperties = {
      marginBottom: '8px',
      paddingBottom: '8px',
      borderBottom: '1px dashed #000',
    };

    const infoLineStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '3px',
      fontSize: '9pt',
    };

    const itemsSectionStyle: React.CSSProperties = {
      marginBottom: '8px',
    };

    const itemsHeaderStyle: React.CSSProperties = {
      fontWeight: 'bold',
      marginBottom: '6px',
      paddingBottom: '4px',
      borderBottom: '1px solid #000',
      fontSize: '9pt',
    };

    const itemStyle: React.CSSProperties = {
      marginBottom: '6px',
      paddingBottom: '6px',
      borderBottom: '1px dotted #ccc',
    };

    const itemNameStyle: React.CSSProperties = {
      fontWeight: 'bold',
      marginBottom: '2px',
      fontSize: '9pt',
    };

    const itemDetailStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '8pt',
    };

    const totalsSectionStyle: React.CSSProperties = {
      borderTop: '2px solid #000',
      paddingTop: '8px',
      marginTop: '4px',
    };

    const totalLineStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '4px',
      fontSize: '9pt',
    };

    const grandTotalLineStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '13pt',
      fontWeight: 'bold',
      borderTop: '1px dashed #000',
      paddingTop: '4px',
      marginTop: '4px',
      marginBottom: '4px',
    };

    const footerStyle: React.CSSProperties = {
      textAlign: 'center',
      marginTop: '10px',
      paddingTop: '8px',
      borderTop: '1px dashed #000',
      fontSize: '9pt',
    };

    return (
      <div ref={ref} className="comprobante-print hidden print:block">
        <div style={baseStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '3px' }}>
              COMPROBANTE DE VENTA
            </div>
            <div style={{ fontSize: '9pt' }}>{empresaNombre}</div>
          </div>

          {/* Info Section */}
          <div style={infoSectionStyle}>
            <div style={infoLineStyle}>
              <span>Fecha:</span>
              <span>{formatearFecha(fecha)}</span>
            </div>
            <div style={{ ...infoLineStyle, fontWeight: 'bold' }}>
              <span>Cliente:</span>
              <span>{clienteNombre}</span>
            </div>
          </div>

          {/* Items Section */}
          <div style={itemsSectionStyle}>
            <div style={itemsHeaderStyle}>
              DETALLE DE PRODUCTOS
            </div>
            {items.map((item, index) => (
              <div key={index} style={itemStyle}>
                <div style={itemNameStyle}>
                  <span style={{ marginRight: '4px', color: '#555' }}>#{index + 1}</span>
                  {item.nombre}
                </div>
                <div style={itemDetailStyle}>
                  <span>Cant: {item.cantidad}</span>
                  <span>P/U: {formatCurrency(item.precioUnitario)}</span>
                </div>
                <div style={{ ...itemDetailStyle, fontWeight: 'bold', marginTop: '2px' }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Section */}
          <div style={totalsSectionStyle}>
            <div style={totalLineStyle}>
              <span>Total Items:</span>
              <span>{items.reduce((sum, item) => sum + item.cantidad, 0)} unidades</span>
            </div>
            <div style={grandTotalLineStyle}>
              <span>TOTAL:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div style={totalLineStyle}>
              <span>Monto Pagado:</span>
              <span>{formatCurrency(montoPagado)}</span>
            </div>
            {metodoPago && (
              <div style={totalLineStyle}>
                <span>Metodo de Pago:</span>
                <span>{metodoPagoLabel[metodoPago]}</span>
              </div>
            )}
            {montoPagado > total && (
              <div style={{ ...totalLineStyle, color: '#059669', fontWeight: 'bold' }}>
                <span>Vuelto:</span>
                <span>{formatCurrency(montoPagado - total)}</span>
              </div>
            )}
            {montoPagado < total && (
              <div style={{ ...totalLineStyle, color: '#dc2626', fontWeight: 'bold' }}>
                <span>Saldo Pendiente:</span>
                <span>{formatCurrency(total - montoPagado)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <div>Gracias por su compra!</div>
          </div>
        </div>
      </div>
    );
  }
);

ComprobanteVenta.displayName = 'ComprobanteVenta';
