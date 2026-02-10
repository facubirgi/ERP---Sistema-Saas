import { useState, useEffect, useCallback } from 'react';
import type { Producto } from '@/lib/types/inventario.types';
import { ProductosApi } from '@/lib/api/productos.api';
import { SEARCH_CONFIG } from '@/lib/utils/inventario.constants';

interface UseBusquedaProductosProps {
  minLength?: number;
}

interface UseBusquedaProductosReturn {
  termino: string;
  productos: Producto[];
  loading: boolean;
  mostrarResultados: boolean;
  error: string | null;
  setTermino: (termino: string) => void;
  limpiarBusqueda: () => void;
  ocultarResultados: () => void;
}

export function useBusquedaProductos({
  minLength = SEARCH_CONFIG.MIN_SEARCH_LENGTH,
}: UseBusquedaProductosProps = {}): UseBusquedaProductosReturn {
  const [termino, setTermino] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarProductos = useCallback(async (abortSignal?: AbortSignal) => {
    if (termino.length < minLength) {
      setProductos([]);
      setMostrarResultados(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ProductosApi.search({
        termino,
        page: 1,
        limit: 10,
      });

      if (response?.data && !abortSignal?.aborted) {
        setProductos(response.data);
        setMostrarResultados(true);
      }
    } catch (err: unknown) {
      if (!abortSignal?.aborted) {
        setError('Error al buscar productos');
        setProductos([]);
        setMostrarResultados(false);
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  }, [termino, minLength]);

  useEffect(() => {
    if (termino.length >= minLength) {
      const abortController = new AbortController();
      const debounceTimer = setTimeout(() => {
        buscarProductos(abortController.signal);
      }, SEARCH_CONFIG.DEBOUNCE_DELAY);
      
      return () => {
        clearTimeout(debounceTimer);
        abortController.abort();
      };
    } else {
      setProductos([]);
      setMostrarResultados(false);
    }
  }, [termino, minLength, buscarProductos]);

  const limpiarBusqueda = useCallback(() => {
    setTermino('');
    setProductos([]);
    setMostrarResultados(false);
    setError(null);
  }, []);

  const ocultarResultados = useCallback(() => {
    setMostrarResultados(false);
  }, []);

  return {
    termino,
    productos,
    loading,
    mostrarResultados,
    error,
    setTermino,
    limpiarBusqueda,
    ocultarResultados,
  };
}
