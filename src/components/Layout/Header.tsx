import React from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '@/src/lib/useAuth';

export function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          aria-label="Buscar"
          placeholder="Buscar incidencias, lotes..."
          className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-red-500/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-4">
        <button 
          title="Notificaciones"
          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{profile?.full_name || profile?.email || 'Usuario'}</p>
            <p className="text-xs text-slate-500 capitalize">{profile?.role || 'User'}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden group relative transition-all">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          
          <button 
            onClick={signOut}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
