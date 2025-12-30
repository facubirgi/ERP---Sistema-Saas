'use client';

// ============================================================================
// PRODUCTO DETAILS - Vista de Detalles de Producto
// ============================================================================

import React from 'react';
import { StockBadge } from './StockBadge';
import type { Producto } from '@/lib/types/inventario.types';

interface ProductoDetailsProps {
  producto: Producto;
  calcularMargen: (costo: number, venta: number) => number;
}

export function ProductoDetails({ producto, calcularMargen }: ProductoDetailsProps) {
  const margen = calcularMargen(producto.precioCosto, producto.precioVenta);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-900">Nombre</p>
          <p className="font-medium">{producto.nombre}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Código de Barras</p>
          <p className="font-medium font-mono">{producto.codigoBarras || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Categoría</p>
          <p className="font-medium">{producto.categoria?.nombre || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Stock</p>
          <StockBadge stockActual={producto.stockActual} stockMinimo={producto.stockMinimo} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Precio de Costo</p>
          <p className="font-medium">${producto.precioCosto.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Precio de Venta</p>
          <p className="font-medium">${producto.precioVenta.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Margen de Ganancia</p>
          <p className="font-medium">{margen.toFixed(1)}% (${(producto.precioVenta - producto.precioCosto).toFixed(2)})</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Stock Mínimo</p>
          <p className="font-medium">{producto.stockMinimo} unidades</p>
        </div>
      </div>
    </div>
  );
}
