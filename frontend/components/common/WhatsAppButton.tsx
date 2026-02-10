'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, FileDown } from 'lucide-react';
import { generarPDFCotizacion, CotizacionPDFData } from '@/lib/utils/pdf.utils';

/**
 * Componente de botón para compartir por WhatsApp
 *
 * Características:
 * - Botón principal que abre un modal
 * - Input para ingresar número de teléfono
 * - Vista previa del mensaje
 * - Validación de número de teléfono
 * - Abre WhatsApp Web al confirmar
 *
 * @example
 * ```tsx
 * <WhatsAppButton
 *   mensaje="Hola, aquí está tu comprobante..."
 *   telefonoPredeterminado="77123456"
 *   onEnviar={() => console.log('Enviado')}
 * />
 * ```
 */

interface WhatsAppButtonProps {
  mensaje: string;
  telefonoPredeterminado?: string;
  onEnviar?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  datosCotizacion?: CotizacionPDFData; // Datos para generar PDF automáticamente
  obtenerDatosCotizacion?: () => Promise<CotizacionPDFData | null>; // Función para obtener datos async
}

export function WhatsAppButton({
  mensaje,
  telefonoPredeterminado = '',
  onEnviar,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  datosCotizacion,
  obtenerDatosCotizacion,
}: WhatsAppButtonProps) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [telefono, setTelefono] = useState(telefonoPredeterminado);
  const [error, setError] = useState<string | null>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const validarTelefono = (tel: string): boolean => {
    const numeroLimpio = tel.replace(/[^\d]/g, '');
    return numeroLimpio.length >= 8;
  };

  const handleEnviar = async () => {
    setError(null);

    if (!validarTelefono(telefono)) {
      setError('Número de teléfono inválido. Debe tener al menos 8 dígitos.');
      return;
    }

    // Obtener datos de cotización si hay función para ello
    let datosPDF: CotizacionPDFData | null | undefined = datosCotizacion;

    if (obtenerDatosCotizacion && !datosPDF) {
      setGenerandoPDF(true);
      try {
        const datos = await obtenerDatosCotizacion();
        if (!datos) {
          setError('No se pudo cargar los datos de la cotización.');
          setGenerandoPDF(false);
          return;
        }
        datosPDF = datos;
      } catch (error) {
          setError('Error al cargar datos. Intenta nuevamente.');
        setGenerandoPDF(false);
        return;
      }
      setGenerandoPDF(false);
    }

    // Generar PDF automáticamente si hay datos de cotización
    if (datosPDF) {
      try {
        generarPDFCotizacion(datosPDF);
      } catch (error) {
          setError('Error al generar el PDF. Intenta nuevamente.');
        return;
      }
    }

    // Formatear número (agregar código de país si falta)
    let numeroFormateado = telefono.replace(/[^\d+]/g, '');
    if (numeroFormateado.startsWith('+')) {
      numeroFormateado = numeroFormateado.substring(1);
    }
    if (numeroFormateado.length === 8) {
      numeroFormateado = '591' + numeroFormateado;
    }

    const mensajeCodificado = encodeURIComponent(mensaje);
    const url = `https://wa.me/${numeroFormateado}?text=${mensajeCodificado}`;

    // Pequeño delay para que el PDF se descargue antes de abrir WhatsApp
    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }, 500);

    if (onEnviar) {
      onEnviar();
    }

    setMostrarModal(false);
  };

  const handleAbrir = () => {
    setTelefono(telefonoPredeterminado);
    setError(null);
    setGenerandoPDF(false);
    setMostrarModal(true);
  };

  // Estilos según variante
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50',
  };

  // Estilos según tamaño
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <>
      {/* Botón Principal */}
      <button
        onClick={handleAbrir}
        disabled={disabled}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium
          transition-all duration-200 shadow-sm hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
      >
        <MessageCircle size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
        <span>Enviar por WhatsApp</span>
      </button>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <MessageCircle className="text-green-600" size={24} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Enviar por WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Input de Teléfono */}
              <div>
                <label
                  htmlFor="telefono-whatsapp"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Número de WhatsApp
                </label>
                <input
                  id="telefono-whatsapp"
                  type="tel"
                  value={telefono}
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    setError(null);
                  }}
                  placeholder="Ej: 77123456 o 59177123456"
                  className={`
                    w-full px-3 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-green-500
                    ${error ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Puedes incluir o no el código de país (591)
                </p>
              </div>

              {/* Vista Previa del Mensaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vista previa del mensaje
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {mensaje}
                  </p>
                </div>
              </div>

              {/* Aviso de PDF */}
              {(datosCotizacion || obtenerDatosCotizacion) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <FileDown className="text-blue-600 shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Se descargará el PDF automáticamente</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Luego adjúntalo manualmente en WhatsApp
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setMostrarModal(false)}
                disabled={generandoPDF}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                disabled={generandoPDF}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generandoPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Generando PDF...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
