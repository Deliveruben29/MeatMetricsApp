import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'management' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Auth] Error al cargar perfil:', error.message);
      return null;
    }
    return data as UserProfile;
  };

  useEffect(() => {
    // 1. Comprobación instantánea al montar (Soluciona el cuelgue de "Cargando sesión")
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const p = await fetchProfile(currentUser.id);
          setProfile(p);
        }
      } catch (err) {
        console.error('[Auth] Error crítico en inicialización:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Suscripción a cambios futuros (Login/Logout/Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Cambio detectado:', event);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const p = await fetchProfile(currentUser.id);
        setProfile(p);
        setLoading(false);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Solo al montar una vez

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    signIn,
    signOut,
  }), [user, profile, loading, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
