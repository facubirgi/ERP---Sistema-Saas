import { Plus, Minus, Trash2, Package } from 'lucide-react';
import type { CarritoItem } from '@/hooks/useCarrito';

interface CarritoListProps {
  items: CarritoItem[];
  onActualizarCantidad: (productoId: string, cantidad: number) => void;
  onEliminar: (productoId: string) => void;
  formatCurrency: (value: number) => string;
  total: number;
}

export function CarritoList({
  items,
  onActualizarCantidad,
  onEliminar,
  formatCurrency,
  total,
}: CarritoListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Package size={18} aria-hidden="true" />
          Productos ({items.length})
        </h4>
      </div>

      {/* Items List */}
      <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.productoId}
            className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            {/* Product Info */}
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.nombre}</p>
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <span>{formatCurrency(item.precioUnitario)} c/u</span>
                <span aria-hidden="true">•</span>
                <span
                  className={
                    item.stockDisponible <= 5 ? 'text-orange-600 font-semibold' : ''
                  }
                >
                  Stock: {item.stockDisponible}
                </span>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onActualizarCantidad(item.productoId, item.cantidad - 1)}
                className="p-1.5 rounded text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={item.cantidad <= 1}
                title="Disminuir cantidad"
                aria-label={`Disminuir cantidad de ${item.nombre}`}
              >
                <Minus size={16} className="stroke-current" />
              </button>

              <input
                type="number"
                value={item.cantidad}
                onChange={(e) => {
                  const valor = parseInt(e.target.value);
                  if (!isNaN(valor)) {
                    onActualizarCantidad(item.productoId, valor);
                  }
                }}
                onBlur={(e) => {
                  const valor = parseInt(e.target.value);
                  if (isNaN(valor) || valor < 1) {
                    onActualizarCantidad(item.productoId, 1);
                  }
                }}
                min="1"
                max={item.stockDisponible}
                className="w-16 text-center border border-gray-300 rounded px-2 py-1.5 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                aria-label={`Cantidad de ${item.nombre}`}
              />

              <button
                type="button"
                onClick={() => onActualizarCantidad(item.productoId, item.cantidad + 1)}
                className="p-1.5 rounded text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={item.cantidad >= item.stockDisponible}
                title="Aumentar cantidad"
                aria-label={`Aumentar cantidad de ${item.nombre}`}
              >
                <Plus size={16} className="stroke-current" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="text-right min-w-[100px]">
              <p className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
            </div>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => onEliminar(item.productoId)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Eliminar producto"
              aria-label={`Eliminar ${item.nombre} del carrito`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-red-50 px-4 py-4 border-t-2 border-red-200">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">Total:</span>
          <span className="text-2xl font-bold text-red-600">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
