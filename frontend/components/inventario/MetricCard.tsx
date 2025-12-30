// ============================================================================
// METRIC CARD COMPONENT - Componente de Inventario
// ============================================================================
// Card para mostrar métricas del inventario

import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    icon: 'text-white',
    border: 'border-blue-200',
    shadow: 'shadow-blue-100',
    hoverShadow: 'hover:shadow-blue-200',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-green-100/50',
    iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
    icon: 'text-white',
    border: 'border-green-200',
    shadow: 'shadow-green-100',
    hoverShadow: 'hover:shadow-green-200',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50',
    iconBg: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    icon: 'text-white',
    border: 'border-yellow-200',
    shadow: 'shadow-yellow-100',
    hoverShadow: 'hover:shadow-yellow-200',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-red-100/50',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    icon: 'text-white',
    border: 'border-red-200',
    shadow: 'shadow-red-100',
    hoverShadow: 'hover:shadow-red-200',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    icon: 'text-white',
    border: 'border-purple-200',
    shadow: 'shadow-purple-100',
    hoverShadow: 'hover:shadow-purple-200',
  },
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'blue',
  onClick,
}: MetricCardProps) {
  const styles = colorStyles[color];
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border ${styles.border} p-6
        shadow-sm ${styles.shadow}
        transition-all duration-300 ease-out
        ${isClickable ? `cursor-pointer hover:shadow-xl ${styles.hoverShadow} hover:scale-[1.02] hover:-translate-y-1` : ''}
        overflow-hidden relative group
      `}
    >
      {/* Gradiente de fondo sutil */}
      <div className={`absolute inset-0 ${styles.bg} opacity-40 group-hover:opacity-60 transition-opacity duration-300`}></div>

      <div className="relative flex items-center justify-between">
        {/* Contenido */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-3">
              <span
                className={`text-sm font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>

        {/* Icono */}
        <div className={`${styles.iconBg} p-4 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
          <Icon className={`${styles.icon} h-7 w-7`} />
        </div>
      </div>
    </div>
  );
}
