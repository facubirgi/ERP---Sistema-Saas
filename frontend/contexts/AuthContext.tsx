'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AuthApi } from '@/lib/api';
import {
  AuthUser,
  LoginDto,
  RegisterDto,
  LoginResponse,
  RegisterResponse,
  UsuarioRol,
} from '@/lib/types/auth.types';
import { ApiError } from '@/lib/types/common.types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SECURITY: Only store non-sensitive user data in localStorage
// JWT token is now stored in httpOnly cookie (server-managed)
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage on mount
  // Note: JWT token is now in httpOnly cookie (secure, XSS-resistant)
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        // Error al parsear usuario almacenado, limpiar datos corruptos
        if (process.env.NODE_ENV === 'development') {
          console.error('Error parsing stored user:', error);
        }
        localStorage.removeItem(USER_KEY);
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (data: LoginDto) => {
    try {
      const response: LoginResponse = await AuthApi.login(data);

      const authUser: AuthUser = {
        userId: response.usuario.id,
        email: response.usuario.email,
        empresaId: response.usuario.empresaId,
        rol: response.usuario.rol,
        nombre: response.usuario.nombre,
        razonSocial: response.empresa.razonSocial,
      };

      setUser(authUser);

      // SECURITY: Only store non-sensitive user data
      // JWT is now in httpOnly cookie (set by backend)
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.message || 'Error al iniciar sesión');
    }
  }, []);

  const register = useCallback(async (data: RegisterDto) => {
    try {
      const response: RegisterResponse = await AuthApi.register(data);

      const authUser: AuthUser = {
        userId: response.usuario.id,
        email: response.usuario.email,
        empresaId: response.usuario.empresaId,
        rol: response.usuario.rol,
        nombre: response.usuario.nombre,
        razonSocial: response.empresa.razonSocial,
      };

      setUser(authUser);

      // SECURITY: Only store non-sensitive user data
      // JWT is now in httpOnly cookie (set by backend)
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.message || 'Error al registrarse');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call backend to clear httpOnly cookie
      await AuthApi.logout();
    } catch (error) {
      // Even if logout fails, clear local state
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout error:', error);
      }
    } finally {
      // Always clear local state
      setUser(null);
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  // Memoizar value para prevenir re-renders innecesarios
  const value: AuthContextType = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      isOwner: user?.rol === UsuarioRol.DUENO,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
