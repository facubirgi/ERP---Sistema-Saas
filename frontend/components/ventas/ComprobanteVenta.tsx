'use client';

// ============================================================================
// COMPROBANTE VENTA - Componente para generar ticket de venta profesional
// ============================================================================
// Formato optimizado para impresoras de tickets 80mm
// Diseño basado en facturas comerciales profesionales

import { forwardRef } from 'react';
import type { CarritoItem } from '@/hooks/useCarrito';
import { MetodoPago } from '@/lib/types/ventas.types';

interface ComprobanteVentaProps {
  // Datos de empresa
  empresaNombre: string;
  empresaDireccion?: string | null;
  empresaTelefono?: string | null;
  empresaEmail?: string | null;
  empresaNit?: string | null;
  // Datos del comprobante
  numeroComprobante?: string;
  fecha?: Date;
  // Datos del cliente
  clienteNombre: string;
  clienteDireccion?: string | null;
  // Items y totales
  items: CarritoItem[];
  subtotal: number;
  descuentoTotal: number;
  total: number;
  // Pago
  montoPagado: number;
  metodoPago?: MetodoPago;
  // Utilidades
  formatCurrency: (value: number) => string;
}

export const ComprobanteVenta = forwardRef<HTMLDivElement, ComprobanteVentaProps>(
  (
    {
      empresaNombre,
      empresaDireccion,
      empresaTelefono,
      empresaEmail,
      empresaNit,
      numeroComprobante,
      fecha = new Date(),
      clienteNombre,
      clienteDireccion,
      items,
      subtotal,
      descuentoTotal,
      total,
      montoPagado,
      metodoPago,
      formatCurrency,
    },
    ref
  ) => {
    const formatearFecha = (fecha: Date) => {
      return fecha.toLocaleString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const metodoPagoLabel: Record<MetodoPago, string> = {
      [MetodoPago.EFECTIVO]: 'Efectivo',
      [MetodoPago.QR]: 'QR',
      [MetodoPago.TARJETA]: 'Tarjeta',
      [MetodoPago.TRANSFERENCIA]: 'Transferencia',
    };

    const vuelto = montoPagado > total ? montoPagado - total : 0;
    const saldoPendiente = montoPagado < total ? total - montoPagado : 0;

    return (
      <div ref={ref} className="comprobante-print hidden print:block">
        <style jsx>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 3mm;
            }

            body {
              margin: 0;
              padding: 0;
            }

            .comprobante-print {
              display: block !important;
              width: 74mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 9pt;
              color: #000;
              background: #fff;
              line-height: 1.3;
            }

            /* === ENCABEZADO EMPRESA === */
            .empresa-header {
              text-align: center;
              padding-bottom: 8px;
              border-bottom: 1px dashed #000;
              margin-bottom: 6px;
            }

            .empresa-nombre {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 4px;
              text-transform: uppercase;
            }

            .empresa-info {
              font-size: 8pt;
              margin-bottom: 2px;
            }

            /* === SECCION NIT === */
            .nit-section {
              text-align: center;
              padding: 6px 0;
              border-bottom: 1px dashed #000;
              margin-bottom: 6px;
            }

            .nit-label {
              font-size: 9pt;
              font-weight: bold;
            }

            /* === TITULO COMPROBANTE === */
            .comprobante-titulo {
              text-align: center;
              padding: 6px 0;
              border-bottom: 1px dashed #000;
              margin-bottom: 6px;
            }

            .comprobante-tipo {
              font-size: 11pt;
              font-weight: bold;
              margin-bottom: 4px;
            }

            .comprobante-numero {
              font-size: 10pt;
              font-weight: bold;
            }

            .comprobante-fecha {
              font-size: 8pt;
              margin-top: 2px;
            }

            /* === DATOS CLIENTE === */
            .cliente-section {
              padding: 6px 0;
              border-bottom: 1px dashed #000;
              margin-bottom: 6px;
            }

            .cliente-label {
              font-size: 8pt;
              font-weight: bold;
              margin-bottom: 2px;
            }

            .cliente-nombre {
              font-size: 9pt;
            }

            .cliente-direccion {
              font-size: 8pt;
              color: #333;
            }

            /* === TABLA DE PRODUCTOS === */
            .productos-header {
              display: flex;
              justify-content: space-between;
              font-size: 8pt;
              font-weight: bold;
              padding: 4px 0;
              border-bottom: 1px solid #000;
              margin-bottom: 4px;
            }

            .col-cant {
              width: 12%;
              text-align: center;
            }

            .col-detalle {
              width: 58%;
              text-align: left;
            }

            .col-total {
              width: 30%;
              text-align: right;
            }

            .producto-item {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 3px 0;
              font-size: 8pt;
            }

            .producto-nombre {
              font-size: 8pt;
              word-break: break-word;
            }

            .producto-total {
              font-size: 8pt;
              font-weight: bold;
            }

            /* === TOTALES === */
            .totales-section {
              border-top: 1px dashed #000;
              padding-top: 6px;
              margin-top: 6px;
            }

            .total-line {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
              font-size: 9pt;
            }

            .total-line.subtotal {
              font-size: 8pt;
            }

            .total-line.descuento {
              font-size: 8pt;
              color: #059669;
            }

            .total-line.final {
              font-size: 11pt;
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 4px;
              margin-top: 4px;
            }

            /* === SECCION PAGO === */
            .pago-section {
              border-top: 1px dashed #000;
              padding-top: 6px;
              margin-top: 6px;
            }

            .pago-line {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
              font-size: 8pt;
            }

            .pago-line.vuelto {
              font-weight: bold;
              color: #059669;
            }

            .pago-line.pendiente {
              font-weight: bold;
              color: #dc2626;
            }

            /* === PIE DE PAGINA === */
            .footer-section {
              text-align: center;
              padding-top: 8px;
              margin-top: 8px;
              border-top: 1px dashed #000;
              font-size: 8pt;
            }

            .footer-gracias {
              font-weight: bold;
              margin-bottom: 4px;
            }
          }
        `}</style>

        {/* ENCABEZADO - DATOS DE EMPRESA */}
        <div className="empresa-header">
          <div className="empresa-nombre">{empresaNombre}</div>
          {empresaDireccion && <div className="empresa-info">{empresaDireccion}</div>}
          {empresaTelefono && <div className="empresa-info">Tel: {empresaTelefono}</div>}
          {empresaEmail && <div className="empresa-info">{empresaEmail}</div>}
        </div>

        {/* SECCION NIT */}
        {empresaNit && (
          <div className="nit-section">
            <span className="nit-label">NIT: {empresaNit}</span>
          </div>
        )}

        {/* TITULO Y NUMERO DE COMPROBANTE */}
        <div className="comprobante-titulo">
          <div className="comprobante-tipo">COMPROBANTE DE VENTA</div>
          {numeroComprobante && <div className="comprobante-numero">N°: {numeroComprobante}</div>}
          <div className="comprobante-fecha">Fecha: {formatearFecha(fecha)}</div>
        </div>

        {/* DATOS DEL CLIENTE */}
        <div className="cliente-section">
          <div className="cliente-label">Cliente:</div>
          <div className="cliente-nombre">{clienteNombre}</div>
          {clienteDireccion && <div className="cliente-direccion">Dir: {clienteDireccion}</div>}
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div className="productos-section">
          <div className="productos-header">
            <span className="col-cant">Cant.</span>
            <span className="col-detalle">Detalle</span>
            <span className="col-total">Total</span>
          </div>

          {items.map((item, index) => (
            <div key={index} className="producto-item">
              <span className="col-cant">{item.cantidad}</span>
              <span className="col-detalle producto-nombre">{item.nombre}</span>
              <span className="col-total producto-total">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* TOTALES */}
        <div className="totales-section">
          {descuentoTotal > 0 && (
            <>
              <div className="total-line subtotal">
                <span>SUBTOTAL</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="total-line descuento">
                <span>DESCUENTO</span>
                <span>-{formatCurrency(descuentoTotal)}</span>
              </div>
            </>
          )}
          <div className="total-line final">
            <span>TOTAL</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* SECCION DE PAGO */}
        <div className="pago-section">
          {metodoPago && (
            <div className="pago-line">
              <span>Metodo de pago:</span>
              <span>{metodoPagoLabel[metodoPago]}</span>
            </div>
          )}
          <div className="pago-line">
            <span>Monto pagado:</span>
            <span>{formatCurrency(montoPagado)}</span>
          </div>
          {vuelto > 0 && (
            <div className="pago-line vuelto">
              <span>Vuelto:</span>
              <span>{formatCurrency(vuelto)}</span>
            </div>
          )}
          {saldoPendiente > 0 && (
            <div className="pago-line pendiente">
              <span>Saldo pendiente:</span>
              <span>{formatCurrency(saldoPendiente)}</span>
            </div>
          )}
        </div>

        {/* PIE DE PAGINA */}
        <div className="footer-section">
          <div className="footer-gracias">Gracias por su compra!</div>
        </div>
      </div>
    );
  }
);

ComprobanteVenta.displayName = 'ComprobanteVenta';
