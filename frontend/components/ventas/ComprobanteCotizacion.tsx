'use client';

// ============================================================================
// COMPROBANTE COTIZACION - Componente para generar cotización imprimible
// ============================================================================

import { forwardRef } from 'react';
import type { CarritoItem } from '@/hooks/useCarrito';

interface ComprobanteCotizacionProps {
  numeroCotizacion: string;
  clienteNombre: string;
  items: CarritoItem[];
  total: number;
  fechaEmision: Date;
  fechaVencimiento: Date;
  usuarioEmisor?: string;
  empresaNombre?: string;
  formatCurrency: (value: number) => string;
}

export const ComprobanteCotizacion = forwardRef<HTMLDivElement, ComprobanteCotizacionProps>(
  ({
    numeroCotizacion,
    clienteNombre,
    items,
    total,
    fechaEmision,
    fechaVencimiento,
    usuarioEmisor,
    empresaNombre = 'Mi Empresa',
    formatCurrency
  }, ref) => {
    const formatearFecha = (fecha: Date) => {
      return new Date(fecha).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
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

    const clienteSeparatorStyle: React.CSSProperties = {
      marginTop: '6px',
      paddingTop: '6px',
      borderTop: '1px dotted #ccc',
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
    };

    const footerStyle: React.CSSProperties = {
      textAlign: 'center',
      marginTop: '10px',
      paddingTop: '8px',
      borderTop: '1px dashed #000',
      fontSize: '8pt',
    };

    return (
      <div ref={ref} className="comprobante-print hidden print:block">
        <div style={baseStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '3px' }}>
              {empresaNombre}
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '15pt', marginBottom: '3px' }}>
              COTIZACION
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>
              {numeroCotizacion}
            </div>
          </div>

          {/* Info Section */}
          <div style={infoSectionStyle}>
            <div style={infoLineStyle}>
              <span>Fecha Emision:</span>
              <span>{formatearFecha(fechaEmision)}</span>
            </div>
            <div style={infoLineStyle}>
              <span>Fecha Vence:</span>
              <span>{formatearFecha(fechaVencimiento)}</span>
            </div>
            {usuarioEmisor && (
              <div style={infoLineStyle}>
                <span>Emitido por:</span>
                <span>{usuarioEmisor}</span>
              </div>
            )}
            <div style={{ ...infoLineStyle, ...clienteSeparatorStyle }}>
              <span style={{ fontWeight: 'bold' }}>Cliente:</span>
              <span style={{ fontWeight: 'bold' }}>{clienteNombre}</span>
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
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <div>Esta es una cotizacion, no un comprobante de venta</div>
            <div style={{ fontWeight: 'bold', marginTop: '4px' }}>
              Valida por 15 dias desde la fecha de emision
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ComprobanteCotizacion.displayName = 'ComprobanteCotizacion';
