// Sistema de Notificaciones Toast
import { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';

// Types
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

// Store para los toasts
export const toastStore = atom<ToastMessage[]>([]);

// Funciones helper para mostrar toasts
export function showToast(toast: Omit<ToastMessage, 'id'>) {
  const id = Math.random().toString(36).substring(7);
  const newToast = { ...toast, id, duration: toast.duration || 4000 };
  toastStore.set([...toastStore.get(), newToast]);
  
  // Auto-remove después del duration
  setTimeout(() => {
    removeToast(id);
  }, newToast.duration);
  
  return id;
}

export function removeToast(id: string) {
  toastStore.set(toastStore.get().filter(t => t.id !== id));
}

// Funciones de conveniencia
export const toast = {
  success: (title: string, message?: string) => showToast({ type: 'success', title, message }),
  error: (title: string, message?: string) => showToast({ type: 'error', title, message }),
  info: (title: string, message?: string) => showToast({ type: 'info', title, message }),
  warning: (title: string, message?: string) => showToast({ type: 'warning', title, message }),
};

// Iconos SVG
const icons = {
  success: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const bgColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
};

const borderColors = {
  success: 'border-green-600',
  error: 'border-red-600',
  info: 'border-blue-600',
  warning: 'border-yellow-600',
};

// Componente Toast individual
function ToastItem({ toast: t, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(onClose, 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4
        bg-white ${borderColors[t.type]}
        transform transition-all duration-300 ease-out
        ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      <div className={`flex-shrink-0 p-1 rounded-full text-white ${bgColors[t.type]}`}>
        {icons[t.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{t.title}</p>
        {t.message && <p className="text-sm text-gray-600 mt-1">{t.message}</p>}
      </div>
      <button
        onClick={handleClose}
        aria-label="Cerrar notificación"
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  'client:load'?: boolean;
  'client:idle'?: boolean;
  'client:visible'?: boolean;
  'client:only'?: string;
}

// Contenedor de Toasts
export default function ToastContainer(_props: ToastContainerProps) {
  const toasts = useStore(toastStore);

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
      aria-atomic="false"
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto" role="alert">
          <ToastItem toast={t} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
}
