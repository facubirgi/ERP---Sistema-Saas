import { useCallback } from 'react';

/**
 * Hook para compartir mensajes y documentos por WhatsApp Web
 *
 * Funcionalidades:
 * - Enviar mensajes de texto a un número específico
 * - Pre-cargar mensajes con información del comprobante
 * - Abrir WhatsApp Web en nueva pestaña
 *
 * @example
 * ```tsx
 * const { compartirPorWhatsApp, generarMensajeVenta } = useWhatsAppShare();
 *
 * const handleEnviar = () => {
 *   const mensaje = generarMensajeVenta({
 *     clienteNombre: "Juan Pérez",
 *     total: 150.50,
 *     numeroComprobante: "V-001-123"
 *   });
 *   compartirPorWhatsApp("59177123456", mensaje);
 * };
 * ```
 */

export interface MensajeVentaParams {
  clienteNombre: string;
  total: number;
  numeroComprobante?: string;
  empresaNombre?: string;
}

export interface MensajeCotizacionParams {
  clienteNombre: string;
  total: number;
  numeroCotizacion: string;
  validezDias?: number;
  empresaNombre?: string;
}

export interface MensajeReporteCajaParams {
  fecha: string;
  saldoTotal: number;
  empresaNombre?: string;
}

export function useWhatsAppShare() {
  /**
   * Formatea un número de teléfono para WhatsApp
   * Elimina espacios, guiones y el símbolo +
   * Asegura que tenga código de país
   */
  const formatearTelefono = useCallback((telefono: string): string => {
    // Eliminar caracteres no numéricos excepto el +
    let numeroLimpio = telefono.replace(/[^\d+]/g, '');

    // Si empieza con +, quitarlo
    if (numeroLimpio.startsWith('+')) {
      numeroLimpio = numeroLimpio.substring(1);
    }

    // Si no tiene código de país (Bolivia: 591), agregarlo
    if (numeroLimpio.length === 8) {
      numeroLimpio = '591' + numeroLimpio;
    }

    return numeroLimpio;
  }, []);

  /**
   * Formatea un monto como moneda boliviana
   */
  const formatearMonto = useCallback((monto: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(monto);
  }, []);

  /**
   * Genera el mensaje para una venta
   */
  const generarMensajeVenta = useCallback(
    (params: MensajeVentaParams): string => {
      const { clienteNombre, total, numeroComprobante, empresaNombre } = params;

      let mensaje = `Hola ${clienteNombre}! 👋\n\n`;

      if (empresaNombre) {
        mensaje += `Gracias por tu compra en *${empresaNombre}*\n\n`;
      }

      mensaje += `📄 *Comprobante de Venta*\n`;

      if (numeroComprobante) {
        mensaje += `N°: ${numeroComprobante}\n`;
      }

      mensaje += `💰 Total: *${formatearMonto(total)}*\n\n`;
      mensaje += `Adjunto encontrarás tu comprobante.\n\n`;
      mensaje += `¡Esperamos verte pronto! 😊`;

      return mensaje;
    },
    [formatearMonto]
  );

  /**
   * Genera el mensaje para una cotización
   */
  const generarMensajeCotizacion = useCallback(
    (params: MensajeCotizacionParams): string => {
      const {
        clienteNombre,
        total,
        numeroCotizacion,
        validezDias = 15,
        empresaNombre
      } = params;

      let mensaje = `Hola ${clienteNombre}!\n\n`;

      if (empresaNombre) {
        mensaje += `Te enviamos la cotización solicitada de ${empresaNombre}\n\n`;
      }

      mensaje += `Cotización\n`;
      mensaje += `N°: ${numeroCotizacion}\n`;
      mensaje += `Total: ${formatearMonto(total)}\n`;
      mensaje += `Válida por ${validezDias} días\n\n`;
      mensaje += `Adjunto encontrarás el detalle completo.\n\n`;
      mensaje += `¿Tienes alguna pregunta? Estamos para ayudarte.`;

      return mensaje;
    },
    [formatearMonto]
  );

  /**
   * Genera el mensaje para un reporte de caja
   */
  const generarMensajeReporteCaja = useCallback(
    (params: MensajeReporteCajaParams): string => {
      const { fecha, saldoTotal, empresaNombre } = params;

      let mensaje = `📊 *Reporte de Caja*\n\n`;

      if (empresaNombre) {
        mensaje += `Empresa: ${empresaNombre}\n`;
      }

      mensaje += `📅 Fecha: ${fecha}\n`;
      mensaje += `💰 Saldo Total: *${formatearMonto(saldoTotal)}*\n\n`;
      mensaje += `Adjunto encontrarás el reporte detallado.`;

      return mensaje;
    },
    [formatearMonto]
  );

  /**
   * Abre WhatsApp Web con el mensaje pre-cargado
   * @param telefono - Número de teléfono (puede incluir código de país)
   * @param mensaje - Mensaje a enviar
   */
  const compartirPorWhatsApp = useCallback(
    (telefono: string, mensaje: string) => {
      const numeroFormateado = formatearTelefono(telefono);
      const mensajeCodificado = encodeURIComponent(mensaje);

      // URL de WhatsApp Web con mensaje pre-cargado
      const url = `https://wa.me/${numeroFormateado}?text=${mensajeCodificado}`;

      // Abrir en nueva pestaña
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [formatearTelefono]
  );

  /**
   * Valida que un número de teléfono sea válido
   */
  const validarTelefono = useCallback((telefono: string): boolean => {
    const numeroLimpio = telefono.replace(/[^\d]/g, '');
    // Debe tener al menos 8 dígitos (número local) o más (con código de país)
    return numeroLimpio.length >= 8;
  }, []);

  return {
    compartirPorWhatsApp,
    generarMensajeVenta,
    generarMensajeCotizacion,
    generarMensajeReporteCaja,
    formatearTelefono,
    validarTelefono,
  };
}
