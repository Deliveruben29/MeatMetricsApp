import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/src/lib/useAuth';
import LoginPage from './LoginPage';

interface AuthGateProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function AuthGate({ children, requiredRoles }: AuthGateProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Cargando sesión...</p>
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
