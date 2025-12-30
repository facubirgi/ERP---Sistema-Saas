'use client';

// ============================================================================
// INVENTARIO CONTAINER - Contenedor Principal con Tabs
// ============================================================================

import { useState } from 'react';
import { Package, FolderOpen, AlertTriangle } from 'lucide-react';
import { TabNavigation, Tab } from './TabNavigation';
import { DashboardInventarioView } from './DashboardInventarioView';
import { ProductosView } from './ProductosView';
import { CategoriasView } from './CategoriasView';
import { StockBajoView } from './StockBajoView';

export function InventarioContainer() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Definir tabs
  const tabs: Tab[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Package,
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: Package,
    },
    {
      id: 'categorias',
      label: 'Categorías',
      icon: FolderOpen,
    },
    {
      id: 'stock-bajo',
      label: 'Stock Bajo',
      icon: AlertTriangle,
    },
  ];

  // Navegación
  const handleNavigateToTab = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleNavigateToNewProduct = () => {
    setActiveTab('productos');
    // TODO: Trigger modal de nuevo producto
  };

  const handleNavigateToNewCategory = () => {
    setActiveTab('categorias');
    // TODO: Trigger modal de nueva categoría
  };

  // Renderizar contenido según tab activo
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardInventarioView
            onNavigateToTab={handleNavigateToTab}
            onNavigateToNewProduct={handleNavigateToNewProduct}
            onNavigateToNewCategory={handleNavigateToNewCategory}
          />
        );
      case 'productos':
        return <ProductosView />;
      case 'categorias':
        return <CategoriasView />;
      case 'stock-bajo':
        return <StockBajoView />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Fijo */}
      <div className="shrink-0 bg-white shadow-sm">
        {/* Título */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h2>
          <p className="text-gray-600 mt-2">
            Vista general de tu inventario, stock y productos
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Content Scrolleable */}
      <div className="flex-1 overflow-y-auto px-6 pt-8">
        {renderContent()}
      </div>
    </div>
  );
}
