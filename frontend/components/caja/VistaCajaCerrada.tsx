import { useState } from 'react';
import { LockKeyhole, Coffee } from 'lucide-react';
import { ModalApertura } from './ModalApertura';

/**
 * Componente VistaCajaCerrada
 *
 * Vista que se muestra cuando NO hay sesión de caja activa
 *
 * Características:
 * - Mensaje amigable indicando que la caja está cerrada
 * - Botón grande y destacado para abrir caja
 * - Empty state con iconografía clara
 *
 * Flujo:
 * 1. Usuario ve mensaje de caja cerrada
 * 2. Click en "Abrir Caja"
 * 3. Se abre ModalApertura
 * 4. Al confirmar, la vista cambia automáticamente a VistaCajaAbierta
 */
export function VistaCajaCerrada() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="max-w-md w-full text-center px-6">
        {/* Icono Principal */}
        <div className="mb-6 flex justify-center">
          <div className="p-6 bg-gray-100 rounded-full">
            <LockKeyhole className="text-gray-400" size={64} />
          </div>
        </div>

        {/* Mensaje Principal */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          La Caja está Cerrada
        </h2>
        <p className="text-gray-600 mb-8">
          No hay ninguna sesión de caja activa en este momento. Para comenzar a
          operar, debes abrir una nueva sesión.
        </p>

        {/* Botón Principal */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <div className="flex items-center justify-center gap-3">
            <Coffee size={24} />
            <span>Abrir Caja / Iniciar Turno</span>
          </div>
        </button>

        {/* Información Adicional */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Recuerda:</strong> Al abrir la caja, deberás ingresar el
            monto inicial en efectivo con el que cuentas para comenzar el turno.
          </p>
        </div>
      </div>

      {/* Modal de Apertura */}
      <ModalApertura
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // El cambio de vista se maneja automáticamente por el estado del contexto
          // No es necesario hacer nada aquí
        }}
      />
    </div>
  );
}
