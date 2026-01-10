'use client';

// ============================================================================
// TAB NAVIGATION COMPONENT - Componente de Inventario
// ============================================================================
// Sistema de tabs para navegar entre secciones de inventario

import { LucideIcon } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: TabNavigationProps) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex gap-2 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-6 border-b-2 font-semibold text-sm
                transition-all duration-300 ease-out relative
                ${
                  isActive
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {/* Background hover effect */}
              <div className={`absolute inset-0 rounded-t-lg transition-all duration-300 ${
                isActive
                  ? 'bg-red-50/50'
                  : 'bg-transparent group-hover:bg-gray-50'
              }`}></div>

              {/* Icon */}
              <Icon
                className={`
                  relative -ml-0.5 mr-2 h-5 w-5 transition-all duration-300
                  ${isActive ? 'text-red-600 scale-110' : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-105'}
                `}
              />

              {/* Label */}
              <span className="relative">{tab.label}</span>

              {/* Badge */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`
                    relative ml-2 py-0.5 px-2 rounded-full text-xs font-bold
                    transition-all duration-300 transform
                    ${
                      isActive
                        ? 'bg-red-600 text-white shadow-md scale-105'
                        : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}

              {/* Active indicator line with gradient */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-red-400 via-red-600 to-red-400"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
