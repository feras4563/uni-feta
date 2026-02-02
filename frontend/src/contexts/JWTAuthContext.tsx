import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signIn as jwtSignIn,
  signOut as jwtSignOut,
  getCurrentUser,
  getToken,
  hasPermission,
  PERMISSIONS,
} from '../lib/jwt-auth';
import type { AppUser, AuthState, LoginCredentials, Permission, UserRole } from '../types/auth';

interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  permissions: Permission[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function JWTAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const loadPermissions = (role: UserRole) => {
    console.log('🔍 JWT: Loading permissions for role:', role);
    
    const clientPermissions: Permission[] = [];
    const rolePerms = PERMISSIONS[role as keyof typeof PERMISSIONS];
    
    if (rolePerms) {
      Object.entries(rolePerms).forEach(([resource, actions]) => {
        clientPermissions.push({ resource, actions });
      });
    }
    
    setPermissions(clientPermissions);
  };

  const handleSignIn = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔍 JWT: Signing in:', credentials.email);
      const user = await jwtSignIn(credentials);
      console.log('✅ JWT: Sign in successful, user object:', user);
      
      // Update state with user
      setState({ user, loading: false, error: null });
      loadPermissions(user.role);
      
      console.log('✅ JWT: Auth state updated, user should now be logged in');
      
    } catch (error) {
      console.error('❌ JWT: Sign in error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await jwtSignOut();
      setState({ user: null, loading: false, error: null });
      setPermissions([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkPermission = (resource: string, action: string): boolean => {
    return hasPermission(permissions, resource, action);
  };

  // Check for existing session on mount
  useEffect(() => {
    console.log('🔍 JWT: Initializing auth context...');
    
    const initAuth = async () => {
      const token = getToken();
      
      if (!token) {
        console.log('🔍 JWT: No token found');
        setState({ user: null, loading: false, error: null });
        return;
      }

      try {
        console.log('🔍 JWT: Token found, fetching user...');
        const user = await getCurrentUser();
        
        if (user) {
          console.log('✅ JWT: User loaded', user);
          setState({ user, loading: false, error: null });
          loadPermissions(user.role);
        } else {
          console.log('🔍 JWT: No user found');
          setState({ user: null, loading: false, error: null });
        }
      } catch (error) {
        console.error('❌ JWT: Init error:', error);
        setState({ user: null, loading: false, error: null });
      }
    };

    initAuth();

    // Force stop loading after 3 seconds
    const timeout = setTimeout(() => {
      console.log('🔍 JWT: Force stopping loading state');
      setState(prev => ({ ...prev, loading: false }));
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const value: AuthContextType = {
    ...state,
    signIn: handleSignIn,
    signOut: handleSignOut,
    hasPermission: checkPermission,
    permissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a JWTAuthProvider');
  }
  return context;
}
