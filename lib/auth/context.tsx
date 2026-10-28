'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, DEMO_USERS } from './types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    full_name: string;
    email: string;
    password?: string;
    role: UserRole;
    hospital_id?: string;
    hospital_name?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'triagesync_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to the citizen demo user or null
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default initial session for immediate interactive demo evaluation
        setUser(DEMO_USERS[0]);
      }
    } catch {
      setUser(DEMO_USERS[0]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserSession = (newUser: UserProfile | null) => {
    setUser(newUser);
    if (newUser) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      } catch {
        // Storage full or unavailable
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage error
      }
    }
  };

  const login = async (email: string): Promise<{ success: boolean; error?: string }> => {
    // Check demo users first
    const foundDemo = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (foundDemo) {
      saveUserSession(foundDemo);
      return { success: true };
    }

    // Default dynamic login
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

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: data.email.trim().toLowerCase(),
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

  const logout = () => {
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
