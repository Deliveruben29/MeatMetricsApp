import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/src/lib/useAuth';
import LoginPage from './LoginPage';

interface AuthGateProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function AuthGate({ children, requiredRoles }: AuthGateProps) {
  const { user, role, loading, signOut } = useAuth();
  const [showRetry, setShowRetry] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => setShowRetry(true), 5000); // Antes 7000, ahora 5000 para mayor agilidad
    } else {
      setShowRetry(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleNuclearEscape = () => {
    console.log('[AuthGate] Ejecutando escape de emergencia...');
    // Cerramos sesión localmente rápido
    signOut();
    // 💣 Ultra-Nuclear: Redirección nativa forzada a la raíz
    // Esto rompe cualquier bucle de React al descargar el script actual
    window.location.assign(window.location.origin + '/?refresh=' + Date.now());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <p className="text-slate-800 font-bold">Sincronizando sesión...</p>
            <p className="text-slate-500 text-sm">Esto no debería tardar mucho. MeatMetrics se está conectando de forma segura.</p>
          </div>
          
          {showRetry && (
            <div className="pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-4 duration-700">
              <p className="text-xs text-slate-400 mb-4">¿Lleva demasiado tiempo? Prueba el escape forzado:</p>
              <button 
                onClick={handleNuclearEscape}
                className="w-full py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                Forzar Salida y Reinicio
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // No autenticado → pantalla de login
  if (!user) {
    return <LoginPage />;
  }

  // Rol insuficiente o perfil no cargado
  const hasRequiredRole = role && requiredRoles?.includes(role);
  if (requiredRoles && !hasRequiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
