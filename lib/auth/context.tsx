'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, DEMO_USERS } from './types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    full_name: string;
    email: string;
    password?: string;
    role: UserRole;
    hospital_id?: string;
    hospital_name?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'triagesync_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  const saveUserSession = (newUser: UserProfile | null) => {
    setUser(newUser);
    if (typeof window !== 'undefined') {
      try {
        if (newUser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // LocalStorage fallback
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const connected = isSupabaseConfigured();
    setIsSupabaseConnected(connected);

    async function initSession() {
      if (connected && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            // Fetch profile from public.profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile) {
              const u: UserProfile = {
                id: profile.id,
                email: profile.email || session.user.email || '',
                full_name: profile.full_name || 'User',
                role: (profile.role as UserRole) || 'citizen',
                hospital_id: profile.hospital_id,
                hospital_name: profile.hospital_name,
                badge_number: profile.badge_number,
                created_at: profile.created_at,
              };
              saveUserSession(u);
              setIsLoading(false);
              return;
            }

            // Fallback to auth user metadata if profile table row not yet triggered
            const meta = session.user.user_metadata || {};
            const u: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: meta.full_name || session.user.email?.split('@')[0] || 'User',
              role: (meta.role as UserRole) || 'citizen',
              hospital_id: meta.hospital_id,
              hospital_name: meta.hospital_name,
              badge_number: meta.badge_number,
              created_at: session.user.created_at,
            };
            saveUserSession(u);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase session load error:', e);
        }
      }

      // Offline / Demo Mode fallback
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored && isMounted) {
            setUser(JSON.parse(stored));
          } else if (isMounted) {
            setUser(DEMO_USERS[0]); // Default initial citizen
          }
        } catch {
          if (isMounted) setUser(DEMO_USERS[0]);
        }
      }
      if (isMounted) setIsLoading(false);
    }

    initSession();

    // Listen to Supabase Auth State Changes
    const client = supabase;
    if (connected && client) {
      const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const meta = session.user.user_metadata || {};
          const u: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: profile?.full_name || meta.full_name || 'User',
            role: (profile?.role || meta.role || 'citizen') as UserRole,
            hospital_id: profile?.hospital_id || meta.hospital_id,
            hospital_name: profile?.hospital_name || meta.hospital_name,
            badge_number: profile?.badge_number || meta.badge_number,
            created_at: session.user.created_at,
          };
          saveUserSession(u);
        } else if (event === 'SIGNED_OUT') {
          saveUserSession(null);
        }
      });

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password = 'Password123!'): Promise<{ success: boolean; error?: string }> => {
    // 1. If Supabase is connected, authenticate via real Supabase Auth
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          // Fetch linked profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          const meta = data.user.user_metadata || {};
          const u: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: profile?.full_name || meta.full_name || email.split('@')[0],
            role: (profile?.role || meta.role || 'citizen') as UserRole,
            hospital_id: profile?.hospital_id || meta.hospital_id,
            hospital_name: profile?.hospital_name || meta.hospital_name,
            badge_number: profile?.badge_number || meta.badge_number,
            created_at: data.user.created_at,
          };

          saveUserSession(u);
          return { success: true };
        }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Supabase authentication failed' };
      }
    }

    // 2. Demo / Fallback Mode (offline or zero-config hackathon mode)
    const foundDemo = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (foundDemo) {
      saveUserSession(foundDemo);
      return { success: true };
    }

    const dynamicUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: email.trim().toLowerCase(),
      full_name: email.split('@')[0] || 'User',
      role: 'citizen',
      created_at: new Date().toISOString(),
    };

    saveUserSession(dynamicUser);
    return { success: true };
  };

  const register = async (data: {
    full_name: string;
    email: string;
    password?: string;
    role: UserRole;
    hospital_id?: string;
    hospital_name?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!data.full_name || !data.email) {
      return { success: false, error: 'Full name and email are required' };
    }

    if (data.role === 'hospital_staff' && !data.hospital_id) {
      return { success: false, error: 'Hospital staff must select an affiliated facility' };
    }

    const email = data.email.trim().toLowerCase();
    const password = data.password || 'Password123!';

    // 1. Real Supabase Auth Registration
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: data.full_name.trim(),
              role: data.role,
              hospital_id: data.hospital_id,
              hospital_name: data.hospital_name,
              badge_number: data.role === 'paramedic' ? 'MED-101' : data.role === 'dispatcher' ? 'CMD-01' : undefined,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (authData.user) {
          // Ensure profile exists in public.profiles
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email,
            full_name: data.full_name.trim(),
            role: data.role,
            hospital_id: data.hospital_id,
            hospital_name: data.hospital_name,
            badge_number: data.role === 'paramedic' ? 'MED-101' : data.role === 'dispatcher' ? 'CMD-01' : undefined,
          });

          const newUser: UserProfile = {
            id: authData.user.id,
            email,
            full_name: data.full_name.trim(),
            role: data.role,
            hospital_id: data.hospital_id,
            hospital_name: data.hospital_name,
            badge_number: data.role === 'paramedic' ? 'MED-101' : data.role === 'dispatcher' ? 'CMD-01' : undefined,
            created_at: authData.user.created_at,
          };

          saveUserSession(newUser);
          return { success: true };
        }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Registration failed with Supabase' };
      }
    }

    // 2. Demo fallback registration
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: data.full_name.trim(),
      role: data.role,
      hospital_id: data.hospital_id,
      hospital_name: data.hospital_name,
      badge_number: data.role === 'paramedic' ? 'MED-101' : data.role === 'dispatcher' ? 'DISP-01' : undefined,
      created_at: new Date().toISOString(),
    };

    saveUserSession(newUser);
    return { success: true };
  };

  const logout = async (): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    saveUserSession(null);
  };

  const switchUser = (role: UserRole) => {
    const demo = DEMO_USERS.find((u) => u.role === role);
    if (demo) {
      saveUserSession(demo);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSupabaseConnected,
        login,
        register,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
