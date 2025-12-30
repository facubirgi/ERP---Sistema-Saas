'use client';

/**
 * PROVIDERS - Wrapper para todos los providers de la aplicación
 *
 * Este componente agrupa todos los Context Providers que requieren
 * 'use client' para funcionar correctamente en Next.js App Router
 */

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ToastContainer } from '@/components/common';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NotificationProvider>
      <AuthProvider>
        {children}
        <ToastContainer />
      </AuthProvider>
    </NotificationProvider>
  );
}
