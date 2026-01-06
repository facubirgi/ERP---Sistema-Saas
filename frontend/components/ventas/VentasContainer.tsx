'use client';

// ============================================================================
// VENTAS CONTAINER - Contenedor Principal con Tabs
// ============================================================================

import { useState } from 'react';
import { LayoutGrid, Receipt, Users, FileText } from 'lucide-react';
import { TabNavigation, Tab } from '../inventario/TabNavigation';
import { DashboardVentasView } from './DashboardVentasView';
import { VentasView } from './VentasView';
import { ClientesView } from './ClientesView';
import { CotizacionesView } from './CotizacionesView';

export function VentasContainer() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Definir tabs
  const tabs: Tab[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: Receipt,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
    },
    {
      id: 'cotizaciones',
      label: 'Cotizaciones',
      icon: FileText,
    },
  ];

  // Navegación
  const handleNavigateToTab = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleNavigateToNewVenta = () => {
    setActiveTab('ventas');
    // TODO: Trigger modal de nueva venta
  };

  // Renderizar contenido según tab activo
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardVentasView
            onNavigateToTab={handleNavigateToTab}
            onNavigateToNewVenta={handleNavigateToNewVenta}
          />
        );
      case 'ventas':
        return <VentasView />;
      case 'clientes':
        return <ClientesView />;
      case 'cotizaciones':
        return <CotizacionesView onNavigateToTab={handleNavigateToTab} />;
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
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Ventas</h2>
          <p className="text-gray-600 mt-2">
            Administra tus ventas y clientes
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
