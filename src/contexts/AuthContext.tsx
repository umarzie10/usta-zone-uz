import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  city?: string;
  region?: string;
  role: 'client' | 'master' | 'admin';
  is_verified: boolean;
  is_blocked: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  isClient: boolean;
  signUp: (email: string, password: string, profileData: Partial<Profile>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (_userId: string) => {
    const { data } = await supabase.rpc('get_my_profile');
    const row = Array.isArray(data) ? data[0] : data;
    if (row) setProfile(row as unknown as Profile);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, profileData: Partial<Profile>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          city: profileData.city || 'Toshkent',
          region: profileData.region || 'Toshkent shahri',
          role: profileData.role || 'client',
        },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@gmail.com' || user?.email === 'umareshqurbonov52@gmail.com';
  const isMaster = profile?.role === 'master';
  const isClient = profile?.role === 'client';

  return (
    <AuthContext.Provider value={{
      user, session, profile, isLoading, isAdmin, isMaster, isClient,
      signUp, signIn, signOut, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
