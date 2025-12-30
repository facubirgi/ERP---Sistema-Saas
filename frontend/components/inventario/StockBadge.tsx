// ============================================================================
// STOCK BADGE COMPONENT - Componente de Inventario
// ============================================================================
// Badge especializado para mostrar estado del stock

import { Badge } from '@/components/common';
import { AlertCircle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { STOCK_CRITICO_THRESHOLD } from '@/lib/utils/inventario.constants';

// Re-exportar la constante para mantener compatibilidad
export { STOCK_CRITICO_THRESHOLD } from '@/lib/utils/inventario.constants';

interface StockBadgeProps {
  stockActual: number;
  stockMinimo: number;
  showLabel?: boolean;
  className?: string;
}

export function StockBadge({
  stockActual,
  stockMinimo,
  showLabel = true,
  className = '',
}: StockBadgeProps) {
  // Determinar el estado del stock
  let variant: 'success' | 'warning' | 'danger';
  let label: string;
  let Icon: typeof CheckCircle;

  if (stockActual === 0) {
    variant = 'danger';
    label = 'Sin Stock';
    Icon = XCircle;
  } else if (stockActual <= stockMinimo * STOCK_CRITICO_THRESHOLD) {
    variant = 'danger';
    label = 'Crítico';
    Icon = AlertCircle;
  } else if (stockActual <= stockMinimo) {
    variant = 'warning';
    label = 'Bajo';
    Icon = AlertTriangle;
  } else {
    variant = 'success';
    label = 'Normal';
    Icon = CheckCircle;
  }

  return (
    <Badge variant={variant} className={`flex items-center gap-1.5 ${className}`}>
      <Icon size={14} className="shrink-0" />
      <span className="font-semibold">{stockActual}</span>
      {showLabel && <span>({label})</span>}
    </Badge>
  );
}
