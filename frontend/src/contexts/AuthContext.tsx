/**
 * Authentication context for global auth state management.
 * Provides login, logout, and current user state.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authService from '../services/auth';

interface User {
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  disabled: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = authService.getToken();
      if (savedToken) {
        try {
          const userData = await authService.getCurrentUser(savedToken);
          setUser(userData);
          setToken(savedToken);
        } catch (error) {
          console.error('Failed to load user:', error);
          authService.removeToken();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const authToken = await authService.login({ username, password });
      authService.saveToken(authToken.access_token);
      setToken(authToken.access_token);

      const userData = await authService.getCurrentUser(authToken.access_token);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (token) {
      await authService.logout(token);
    }
    authService.removeToken();
    setUser(null);
    setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
