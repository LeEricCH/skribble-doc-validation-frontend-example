import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initKeycloak, isAuthenticated, login, logout, getUserInfo } from '@/utils/keycloak';

interface User {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticatedState, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Initialize Keycloak
        await initKeycloak();
        
        // Check if authenticated and update state
        const authStatus = isAuthenticated();
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          const userInfo = getUserInfo();
          setUser(userInfo);
          console.log('User authenticated:', userInfo?.username || userInfo?.email);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      // Check if we're on the callback URL
      if (window.location.hash?.includes('state=')) {
        console.log('Detected auth callback, waiting for processing...');
        // The Keycloak will handle this automatically in initAuth
      }
      
      initAuth();
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login();
      // login() redirects, so this code will only run if the redirect doesn't happen
      // (e.g., if already logged in), so we need to update state here
      const authStatus = isAuthenticated();
      setIsAuthenticated(authStatus);
      
      if (authStatus) {
        const userInfo = getUserInfo();
        setUser(userInfo);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      // This will redirect to Keycloak logout, but if something fails, clear local state
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: isAuthenticatedState,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 