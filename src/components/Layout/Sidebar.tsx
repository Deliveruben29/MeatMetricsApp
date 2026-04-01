import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileUp, ClipboardList, Settings, LogOut } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/lib/useAuth';

export function Sidebar() {
  const { role, signOut } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'management', 'user'] },
    { icon: FileUp, label: 'Importar', path: '/import', roles: ['admin', 'management'] },
    { icon: ClipboardList, label: 'Registro Maestro', path: '/registry', roles: ['admin', 'management', 'user'] },
  ];

  const visibleItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 border-2 border-white/20">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">MeatMetrics</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-red-50 text-red-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )
            }
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-1">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all w-full text-left group">
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          <span className="font-medium text-sm">Configuración</span>
        </button>
        <button 
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full text-left group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
