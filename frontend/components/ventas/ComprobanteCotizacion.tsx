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

    return (
      <div ref={ref} className="comprobante-print hidden print:block">
        <style jsx>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 5mm;
            }

            body {
              margin: 0;
              padding: 0;
            }

            .comprobante-print {
              display: block !important;
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 10pt;
              color: #000;
              background: #fff;
            }

            .comprobante-header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }

            .comprobante-title {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 5px;
            }

            .comprobante-numero {
              font-size: 12pt;
              font-weight: bold;
              color: #0891b2;
            }

            .comprobante-info {
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px dashed #000;
            }

            .comprobante-info-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }

            .comprobante-items {
              margin-bottom: 10px;
            }

            .comprobante-item {
              margin-bottom: 8px;
              padding-bottom: 8px;
              border-bottom: 1px dotted #ccc;
            }

            .comprobante-item-name {
              font-weight: bold;
              margin-bottom: 2px;
            }

            .comprobante-item-detail {
              display: flex;
              justify-content: space-between;
              font-size: 9pt;
            }

            .comprobante-totals {
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }

            .comprobante-total-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }

            .comprobante-total-line.final {
              font-size: 12pt;
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }

            .comprobante-footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px dashed #000;
              font-size: 9pt;
            }

            .comprobante-validez {
              margin-top: 8px;
              font-weight: bold;
              color: #666;
            }
          }
        `}</style>

        <div className="comprobante-header">
          <div className="comprobante-title">COTIZACIÓN</div>
          <div className="comprobante-numero">{numeroCotizacion}</div>
          <div style={{ fontSize: '9pt', marginTop: '5px' }}>{empresaNombre}</div>
        </div>

        <div className="comprobante-info">
          <div className="comprobante-info-line">
            <span>Fecha Emisión:</span>
            <span>{formatearFecha(fechaEmision)}</span>
          </div>
          <div className="comprobante-info-line">
            <span>Fecha Vencimiento:</span>
            <span>{formatearFecha(fechaVencimiento)}</span>
          </div>
          {usuarioEmisor && (
            <div className="comprobante-info-line">
              <span>Emitido por:</span>
              <span>{usuarioEmisor}</span>
            </div>
          )}
          <div className="comprobante-info-line" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dotted #ccc' }}>
            <span>Cliente:</span>
            <span style={{ fontWeight: 'bold' }}>{clienteNombre}</span>
          </div>
        </div>

        <div className="comprobante-items">
          <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
            DETALLE DE PRODUCTOS
          </div>
          {items.map((item, index) => (
            <div key={index} className="comprobante-item">
              <div className="comprobante-item-name">
                <span style={{ marginRight: '5px', color: '#666' }}>#{index + 1}</span>
                {item.nombre}
              </div>
              <div className="comprobante-item-detail">
                <span>Cant: {item.cantidad}</span>
                <span>P/U: {formatCurrency(item.precioUnitario)}</span>
              </div>
              <div className="comprobante-item-detail" style={{ fontWeight: 'bold', marginTop: '2px' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="comprobante-totals">
          <div className="comprobante-total-line" style={{ fontSize: '10pt' }}>
            <span>Total Items:</span>
            <span>{items.reduce((sum, item) => sum + item.cantidad, 0)} unidades</span>
          </div>
          <div className="comprobante-total-line final">
            <span>TOTAL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="comprobante-footer">
          <div>Esta es una cotización, no un comprobante de venta</div>
          <div className="comprobante-validez">
            Válida por 15 días desde la fecha de emisión
          </div>
        </div>
      </div>
    );
  }
);

ComprobanteCotizacion.displayName = 'ComprobanteCotizacion';