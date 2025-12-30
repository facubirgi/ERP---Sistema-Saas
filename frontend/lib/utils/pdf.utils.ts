import jsPDF from 'jspdf';

/**
 * Datos necesarios para generar PDF de cotización
 */
export interface CotizacionPDFData {
  numeroComprobante: string;
  fechaEmision: Date | string;
  fechaVencimiento: Date | string;
  clienteNombre: string;
  empresaNombre: string;
  items: {
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  total: number;
}

/**
 * Formatea fecha a string legible
 */
const formatearFecha = (fecha: Date | string): string => {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return fechaObj.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formatea monto como moneda boliviana
 */
const formatearMonto = (monto: number): string => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(monto);
};

/**
 * Genera PDF de cotización y lo descarga automáticamente
 * Formato optimizado para ticket 80mm
 */
export const generarPDFCotizacion = (data: CotizacionPDFData): void => {
  // Crear documento PDF formato ticket 80mm
  // 80mm = 226.77 puntos (aprox)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 297], // Ancho 80mm, alto A4 para contenido variable
  });

  let y = 10; // Posición Y inicial
  const margen = 5; // Margen lateral
  const anchoUtil = 70; // Ancho útil (80 - 2*margen)

  // Función helper para agregar texto
  const agregarTexto = (
    texto: string,
    x: number,
    fontSize: number = 10,
    style: 'normal' | 'bold' = 'normal',
    align: 'left' | 'center' | 'right' = 'left'
  ) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', style);
    pdf.text(texto, x, y, { align });
    y += fontSize * 0.4 + 2; // Incrementar posición Y
  };

  // Función helper para agregar línea separadora
  const agregarLinea = () => {
    pdf.setLineWidth(0.3);
    pdf.line(margen, y, margen + anchoUtil, y);
    y += 3;
  };

  // ENCABEZADO - EMPRESA
  agregarTexto(data.empresaNombre, 40, 12, 'bold', 'center');
  y += 2;
  agregarLinea();

  // TÍTULO
  agregarTexto('COTIZACIÓN', 40, 14, 'bold', 'center');
  y += 2;

  // NÚMERO Y FECHAS
  agregarTexto(`N°: ${data.numeroComprobante}`, margen, 10, 'bold');
  agregarTexto(`Fecha: ${formatearFecha(data.fechaEmision)}`, margen, 9);
  agregarTexto(`Vence: ${formatearFecha(data.fechaVencimiento)}`, margen, 9);
  y += 2;
  agregarLinea();

  // CLIENTE
  agregarTexto('CLIENTE:', margen, 10, 'bold');
  agregarTexto(data.clienteNombre, margen, 9);
  y += 2;
  agregarLinea();

  // TABLA DE ITEMS - ENCABEZADO
  agregarTexto('DETALLE', margen, 9, 'bold');
  y += 1;

  // ITEMS
  data.items.forEach((item) => {
    // Nombre del producto
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    // Dividir nombre largo en múltiples líneas si es necesario
    const maxAncho = anchoUtil;
    const lineasNombre = pdf.splitTextToSize(item.nombreProducto, maxAncho);

    lineasNombre.forEach((linea: string) => {
      pdf.text(linea, margen, y);
      y += 4;
    });

    // Cantidad x Precio = Subtotal
    const detalleLinea = `${item.cantidad} x ${formatearMonto(item.precioUnitario)} = ${formatearMonto(item.subtotal)}`;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(detalleLinea, margen + 2, y);
    y += 5;
  });

  y += 1;
  agregarLinea();

  // TOTAL
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL:', margen, y);
  pdf.text(formatearMonto(data.total), margen + anchoUtil, y, { align: 'right' });
  y += 6;

  agregarLinea();

  // VALIDEZ
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  const textoValidez = 'Válida por 15 días';
  pdf.text(textoValidez, 40, y, { align: 'center' });
  y += 5;

  // MENSAJE FINAL
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const mensajeFinal = '¡Gracias por su preferencia!';
  pdf.text(mensajeFinal, 40, y, { align: 'center' });

  // Generar nombre de archivo
  const nombreArchivo = `Cotizacion_${data.numeroComprobante.replace(/\//g, '-')}.pdf`;

  // Descargar PDF
  pdf.save(nombreArchivo);
};

/**
 * Genera PDF de cotización a partir de datos simples
 * Útil cuando no tienes todos los detalles completos
 */
export const generarPDFCotizacionSimple = (
  numeroComprobante: string,
  clienteNombre: string,
  total: number,
  empresaNombre: string,
  items?: { nombreProducto: string; cantidad: number; precioUnitario: number; subtotal: number }[]
): void => {
  const fechaHoy = new Date();
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaHoy.getDate() + 15);

  const data: CotizacionPDFData = {
    numeroComprobante,
    fechaEmision: fechaHoy,
    fechaVencimiento,
    clienteNombre,
    empresaNombre,
    items: items || [],
    total,
  };

  generarPDFCotizacion(data);
};
