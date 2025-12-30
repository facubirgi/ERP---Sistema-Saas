import { Search, Plus } from 'lucide-react';
import type { Producto } from '@/lib/types/inventario.types';

interface ProductSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  productos: Producto[];
  loading: boolean;
  mostrarResultados: boolean;
  error: string | null;
  onSelectProducto: (producto: Producto) => void;
  formatCurrency: (value: number) => string;
}

export function ProductSearchInput({
  value,
  onChange,
  productos,
  loading,
  mostrarResultados,
  error,
  onSelectProducto,
  formatCurrency,
}: ProductSearchInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        Buscar Producto
      </label>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          size={20}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Buscar producto"
          aria-describedby={error ? 'search-error' : undefined}
        />

        {/* Dropdown de productos */}
        {mostrarResultados && productos.length > 0 && (
          <div
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
            aria-label="Resultados de búsqueda"
          >
            {productos.map((producto) => (
              <button
                key={producto.id}
                type="button"
                onClick={() => onSelectProducto(producto)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                role="option"
                aria-selected="false"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{producto.nombre}</p>
                    <p className="text-sm text-gray-500">
                      Stock: {producto.stockActual} | {formatCurrency(producto.precioVenta)}
                    </p>
                  </div>
                  <Plus className="text-blue-600" size={20} aria-hidden="true" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div
              className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
              role="status"
              aria-label="Buscando productos"
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p id="search-error" className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
