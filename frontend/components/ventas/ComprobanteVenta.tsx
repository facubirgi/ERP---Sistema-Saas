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
  formatCurrency: (value: number) => string;
}

export const ComprobanteVenta = forwardRef<HTMLDivElement, ComprobanteVentaProps>(
  ({ clienteNombre, items, total, montoPagado, metodoPago, fecha = new Date(), formatCurrency }, ref) => {
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
          }
        `}</style>

        <div className="comprobante-header">
          <div className="comprobante-title">COMPROBANTE DE VENTA</div>
          <div style={{ fontSize: '9pt' }}>Sistema SaaS</div>
        </div>

        <div className="comprobante-info">
          <div className="comprobante-info-line">
            <span>Fecha:</span>
            <span>{formatearFecha(fecha)}</span>
          </div>
          <div className="comprobante-info-line">
            <span>Cliente:</span>
            <span>{clienteNombre}</span>
          </div>
        </div>

        <div className="comprobante-items">
          <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
            DETALLE DE PRODUCTOS
          </div>
          {items.map((item, index) => (
            <div key={index} className="comprobante-item">
              <div className="comprobante-item-name">{item.nombre}</div>
              <div className="comprobante-item-detail">
                <span>Cant: {item.cantidad}</span>
                <span>P/U: {formatCurrency(item.precioUnitario)}</span>
                <span>Subtotal: {formatCurrency(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="comprobante-totals">
          <div className="comprobante-total-line final">
            <span>TOTAL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="comprobante-total-line">
            <span>Monto Pagado:</span>
            <span>{formatCurrency(montoPagado)}</span>
          </div>
          {metodoPago && (
            <div className="comprobante-total-line">
              <span>Método de Pago:</span>
              <span>{metodoPagoLabel[metodoPago]}</span>
            </div>
          )}
        </div>

        <div className="comprobante-footer">
          <div>¡Gracias por su compra!</div>
        </div>
      </div>
    );
  }
);

ComprobanteVenta.displayName = 'ComprobanteVenta';
