import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isVip: boolean;
  vipTier: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [vipTier, setVipTier] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
            checkVipStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsVip(false);
          setVipTier('free');
        }
        setLoading(false);
      }
    );

    // Get initial session and refresh if needed
    const initSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      // If we have a session, try to refresh it
      if (session) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Session refresh failed:', refreshError.message);
        } else if (refreshData.session) {
          setSession(refreshData.session);
          setUser(refreshData.session.user);
          checkAdminRole(refreshData.session.user.id);
          checkVipStatus(refreshData.session.user.id);
          setLoading(false);
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdminRole(session.user.id);
        checkVipStatus(session.user.id);
      }
      setLoading(false);
    };

    initSession();

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!!data);
  };

  const checkVipStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('vip_tier, vip_expires_at')
      .eq('id', userId)
      .single();

    if (data) {
      const tier = data.vip_tier || 'free';
      const expiresAt = data.vip_expires_at ? new Date(data.vip_expires_at) : null;
      const now = new Date();

      // Check if VIP is active (silver or gold and not expired)
      const isActiveVip = (tier === 'silver' || tier === 'gold') &&
        (!expiresAt || expiresAt > now);

      setVipTier(tier);
      setIsVip(isActiveVip);
    } else {
      setVipTier('free');
      setIsVip(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { username }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsVip(false);
    setVipTier('free');
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isVip, vipTier, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
