import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "../../lib/supabase";

export type UserRole = "Admin" | "IT Officers" | "HR Officers";
export type LoginFailureReason =
  | "invalid_credentials"
  | "blocked"
  | "role_mismatch"
  | "profile_not_found"
  | "unknown";

export interface LoginResult {
  success: boolean;
  reason?: LoginFailureReason;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isBlocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<LoginResult>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const applyProfile = async (profile: any) => {
    const isBlocked = Boolean(profile?.is_blocked);

    if (isBlocked) {
      await supabase.auth.signOut();
      clearAuthState();
      return false;
    }

    setUser({
      id: profile.user_id,
      email: profile.email,
      name: profile.full_name || profile.email,
      role: profile.role as UserRole,
      isBlocked,
    });
    setIsAuthenticated(true);
    return true;
  };

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Get user profile from users table
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();
        
        if (profile) {
          await applyProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Get user profile from users table
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();
        
        if (profile) {
          await applyProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  useEffect(() => {
    // Check current session on mount
    checkSession();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Set up real-time subscription for user profile updates
    const subscription = supabase
      .channel('user-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          // Check if the updated user is the current user
          if (user && payload.new.user_id === user.id) {
            console.log('User profile updated, refreshing...');
            refreshUser();
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, refreshUser]); // Re-subscribe when user id changes

  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<LoginResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, reason: "invalid_credentials" };
      }

      if (data.user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', data.user.id)
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          clearAuthState();
          return { success: false, reason: "profile_not_found" };
        }

        if (profile) {
          const actualRole = profile.role as UserRole;
          const isBlocked = Boolean(profile.is_blocked);

          if (isBlocked) {
            await supabase.auth.signOut();
            clearAuthState();
            return { success: false, reason: "blocked" };
          }

          if (actualRole !== role) {
            await supabase.auth.signOut();
            clearAuthState();
            console.error("Role mismatch during login:", {
              selectedRole: role,
              actualRole,
            });
            return { success: false, reason: "role_mismatch" };
          }

          setUser({
            id: profile.user_id,
            email: profile.email,
            name: profile.full_name || profile.email,
            role: actualRole,
            isBlocked,
          });
          setIsAuthenticated(true);
          return { success: true };
        }
      }

      return { success: false, reason: "unknown" };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, reason: "unknown" };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile in users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .insert([
            {
              auth_id: authData.user.id,
              email,
              full_name: name,
              role: 'user',
            },
          ])
          .select()
          .single();

        if (profileError) throw profileError;

        if (profile) {
          setUser({
            id: profile.user_id,
            email: profile.email,
            name: profile.full_name || profile.email,
            role: profile.role as UserRole,
          });
          setIsAuthenticated(true);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      clearAuthState();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
