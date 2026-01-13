import { useState, useCallback } from 'react';
import type { Producto } from '@/lib/types/inventario.types';
import type { ItemVentaDto } from '@/lib/types/ventas.types';

export interface CarritoItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje: number;
  subtotal: number;
  stockDisponible: number;
}

export interface ItemCotizacion {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface UseCarritoReturn {
  carrito: CarritoItem[];
  agregarProducto: (producto: Producto) => { success: boolean; mensaje?: string };
  actualizarCantidad: (productoId: string, cantidad: number) => void;
  actualizarDescuento: (productoId: string, descuentoPorcentaje: number) => void;
  eliminarProducto: (productoId: string) => void;
  limpiarCarrito: () => void;
  calcularTotal: () => number;
  obtenerItems: () => ItemVentaDto[];
  obtenerItemsCotizacion: () => ItemCotizacion[];
}

export function useCarrito(): UseCarritoReturn {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  const agregarProducto = useCallback((producto: Producto) => {
    let resultado: { success: boolean; mensaje?: string } = { success: false, mensaje: '' };

    setCarrito((prevCarrito) => {
      const itemExistente = prevCarrito.find((item) => item.productoId === producto.id);

      if (itemExistente) {
        // Verificar si hay stock disponible
        if (itemExistente.cantidad >= producto.stockActual) {
          resultado = {
            success: false,
            mensaje: 'No hay suficiente stock disponible',
          };
          return prevCarrito;
        }

        // Incrementar cantidad
        resultado = { success: true };
        return prevCarrito.map((item) =>
          item.productoId === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: Number(((item.cantidad + 1) * item.precioUnitario * (1 - item.descuentoPorcentaje / 100)).toFixed(2)),
              }
            : item
        );
      } else {
        // Verificar stock antes de agregar
        if (producto.stockActual <= 0) {
          resultado = {
            success: false,
            mensaje: 'Producto sin stock',
          };
          return prevCarrito;
        }

        // Agregar nuevo item
        const nuevoItem: CarritoItem = {
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precioUnitario: producto.precioVenta,
          descuentoPorcentaje: 0,
          subtotal: producto.precioVenta,
          stockDisponible: producto.stockActual,
        };

        resultado = { success: true };
        return [...prevCarrito, nuevoItem];
      }
    });

    return resultado;
  }, []);

  const actualizarCantidad = useCallback((productoId: string, nuevaCantidad: number) => {
    setCarrito((prevCarrito) =>
      prevCarrito.map((item) => {
        if (item.productoId === productoId) {
          // Validar y limitar cantidad
          const cantidad = Math.max(1, Math.min(Math.floor(nuevaCantidad), item.stockDisponible));
          return {
            ...item,
            cantidad,
            subtotal: Number((cantidad * item.precioUnitario * (1 - item.descuentoPorcentaje / 100)).toFixed(2)),
          };
        }
        return item;
      })
    );
  }, []);
  const actualizarDescuento = useCallback((productoId: string, descuentoPorcentaje: number) => {
    setCarrito((prevCarrito) =>
      prevCarrito.map((item) => {
        if (item.productoId === productoId) {
          // Validar y limitar descuento entre 0 y 100
          const descuento = Math.max(0, Math.min(100, descuentoPorcentaje));
          return {
            ...item,
            descuentoPorcentaje: descuento,
            subtotal: Number((item.cantidad * item.precioUnitario * (1 - descuento / 100)).toFixed(2)),
          };
        }
        return item;
      })
    );
  }, []);
  const eliminarProducto = useCallback((productoId: string) => {
    setCarrito((prevCarrito) => prevCarrito.filter((item) => item.productoId !== productoId));
  }, []);

  const limpiarCarrito = useCallback(() => {
    setCarrito([]);
  }, []);

  const calcularTotal = useCallback(() => {
    return carrito.reduce((sum, item) => sum + item.subtotal, 0);
  }, [carrito]);

  const obtenerItems = useCallback((): ItemVentaDto[] => {
    return carrito.map((item) => {
      // Aplicar descuento al precio unitario para que el backend valide correctamente
      const precioConDescuento = Number((item.precioUnitario * (1 - item.descuentoPorcentaje / 100)).toFixed(2));
      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: precioConDescuento,
      };
    });
  }, [carrito]);

  const obtenerItemsCotizacion = useCallback((): ItemCotizacion[] => {
    return carrito.map((item) => {
      // Aplicar descuento al precio unitario para que el backend valide correctamente
      const precioConDescuento = Number((item.precioUnitario * (1 - item.descuentoPorcentaje / 100)).toFixed(2));
      return {
        productoId: item.productoId,
        nombreProducto: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: precioConDescuento,
        subtotal: item.subtotal,
      };
    });
  }, [carrito]);

  return {
    carrito,
    agregarProducto,
    actualizarCantidad,
    actualizarDescuento,
    eliminarProducto,
    limpiarCarrito,
    calcularTotal,
    obtenerItems,
    obtenerItemsCotizacion,
  };
}
