'use client';

// ============================================================================
// SEARCH BAR COMPONENT - Componente Reutilizable
// ============================================================================
// Barra de búsqueda con debounce y funcionalidad de limpieza

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  initialValue?: string;
}

export function SearchBar({
  placeholder = 'Buscar...',
  onSearch,
  debounceMs = 300,
  className = '',
  initialValue = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  // Debounce: ejecutar búsqueda después de que el usuario deje de escribir
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, onSearch]);

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Icono de búsqueda */}
      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 ${
        isFocused ? 'text-blue-600' : 'text-gray-400'
      }`}>
        <Search className={`h-5 w-5 transition-transform duration-200 ${
          isFocused ? 'scale-110' : ''
        }`} />
      </div>

      {/* Input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          block w-full pl-12 pr-12 py-3
          border-2 rounded-xl
          placeholder-gray-400 text-gray-900 font-medium
          transition-all duration-300
          shadow-sm
          ${isFocused
            ? 'border-blue-500 ring-4 ring-blue-100 shadow-lg'
            : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
          }
        `}
      />

      {/* Botón para limpiar */}
      {query && (
        <button
          onClick={handleClear}
          className="
            absolute inset-y-0 right-0 pr-4
            flex items-center text-gray-400
            hover:text-red-600 transition-all duration-200
            hover:scale-110
          "
          title="Limpiar búsqueda"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
