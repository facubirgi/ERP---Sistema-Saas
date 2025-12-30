'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  requireOwner?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const sidebarItems: SidebarItem[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    name: 'Inventario',
    icon: Package,
    path: '/dashboard/inventario',
  },
  {
    name: 'Ventas',
    icon: ShoppingCart,
    path: '/dashboard/ventas',
  },
  {
    name: 'Caja',
    icon: Wallet,
    path: '/dashboard/caja',
  },
  {
    name: 'Usuarios',
    icon: Users,
    path: '/dashboard/usuarios',
    requireOwner: true,
  },
  {
    name: 'Configuración',
    icon: Settings,
    path: '/dashboard/configuracion',
  },
];

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const { isOwner } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const filteredItems = sidebarItems.filter(
    (item) => !item.requireOwner || isOwner
  );

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <aside
      className={`bg-gray-900 border-r border-gray-800 fixed left-0 top-16 bottom-0 z-20 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Sidebar Navigation */}
      <nav className="p-3 pt-6">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon size={20} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
