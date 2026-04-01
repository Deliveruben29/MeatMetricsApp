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
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;
    let authListener: any = null;

    // 🛡️ Safety Timeout (Unblock UI no matter what)
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Auth] Safety Timeout: Forzando desbloqueo.');
        setLoading(false);
      }
    }, 8000);

    const init = async () => {
      try {
        // Obtenemos sesión inicial de forma síncrona/rápida
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        const currentUser = session?.user ?? null;
        if (currentUser) {
          setUser(currentUser);
          const p = await fetchProfile(currentUser.id);
          if (isMounted) setProfile(p);
        }
      } catch (err) {
        console.error('[Auth] Error init:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }

      // Suscribirse a cambios después del init
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        console.log(`[Auth] Evento: ${event}`);
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const p = await fetchProfile(currentUser.id);
          if (isMounted) setProfile(p);
        } else {
          if (isMounted) setProfile(null);
        }
        
        if (isMounted) setLoading(false);
      });
      authListener = subscription;
    };

    init();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (authListener) {
        if (typeof authListener.unsubscribe === 'function') {
          authListener.unsubscribe();
        }
      }
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
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
