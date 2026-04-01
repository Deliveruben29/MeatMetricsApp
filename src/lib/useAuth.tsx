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

    // 🛡️ Safety Timeout (Unlock UI after 10s if Supabase hangs)
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Auth] Safety Timeout disparado. Forzando setLoading(false).');
        setLoading(false);
      }
    }, 10000);

    const initializeAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        console.log(`[Auth] Evento: ${event}`, session?.user?.id || 'No User');
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        try {
          if (currentUser) {
            const p = await fetchProfile(currentUser.id);
            if (isMounted) setProfile(p);
          } else {
            if (isMounted) setProfile(null);
          }
        } catch (err) {
          console.error('[Auth] Error procesando sesión:', err);
        } finally {
          if (isMounted) {
            setLoading(false);
            if (timeoutId) clearTimeout(timeoutId);
          }
        }
      });

      return subscription;
    };

    const subPromise = initializeAuth();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subPromise.then(sub => sub.unsubscribe());
    };
  }, []); // Solo al montar una vez

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
