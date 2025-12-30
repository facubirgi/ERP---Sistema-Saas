'use client';

import { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { CajaProvider } from '@/contexts/CajaContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <CajaProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <Navbar />

        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content */}
        <main
          className={`pt-16 transition-all duration-300 ${
            isSidebarCollapsed ? 'pl-16' : 'pl-64'
          }`}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </CajaProvider>
  );
}
