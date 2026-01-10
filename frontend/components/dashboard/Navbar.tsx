'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCajaContext } from '@/contexts/CajaContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown, LogOut, User, Wallet } from 'lucide-react';
import { useState, memo, useEffect } from 'react';
import { EstadoCaja } from '@/lib/types/caja.types';

export const Navbar = memo(function Navbar() {
  const { user, logout } = useAuth();
  const { sesion, fetchSesionActual } = useCajaContext();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Cargar sesión actual al montar el componente
  useEffect(() => {
    fetchSesionActual();
  }, [fetchSesionActual]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Determinar si la caja está abierta
  const cajaAbierta = sesion?.estado === EstadoCaja.ABIERTA;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 h-16 flex items-center px-6 fixed top-0 right-0 left-0 z-30">
      <div className="flex items-center justify-between w-full">
        {/* Logo and Company Name */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white flex items-center justify-center">
              <Image
                src="/logo.jpeg"
                alt="ESimple Logo"
                width={36}
                height={36}
                className="object-cover"
              />
            </div>
            <div className="text-2xl font-bold text-white">
              ESimple
            </div>
          </div>
          <div className="h-6 w-px bg-gray-700"></div>
          <span className="text-sm text-gray-400">{user?.razonSocial}</span>
        </div>

        {/* Right Side - Cash Register Status, Notifications and Profile */}
        <div className="flex items-center space-x-4">
          {/* Estado de Caja Indicator - Siempre visible */}
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              cajaAbierta
                ? 'bg-green-900/30 border-green-600/50'
                : 'bg-red-900/30 border-red-600/50'
            }`}
          >
            <Wallet
              size={18}
              className={cajaAbierta ? 'text-green-400' : 'text-red-400'}
            />
            <div className="hidden md:block">
              <p className="text-xs font-medium text-gray-400">Caja</p>
              <p
                className={`text-sm font-semibold ${
                  cajaAbierta ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {cajaAbierta ? 'Abierta' : 'Cerrada'}
              </p>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 bg-linear-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-white">{user?.nombre}</p>
                <p className="text-xs text-gray-400">{user?.rol}</p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProfileMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-20">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{user?.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>

                  <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2">
                    <User size={16} />
                    <span>Mi Perfil</span>
                  </button>

                  <div className="border-t border-gray-700 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
});
