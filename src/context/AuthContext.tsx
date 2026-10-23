import React, { createContext, useState, useEffect, ReactNode } from 'react';
// import { authUtils } from '../utils/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  // logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // const isAuthenticated = await authUtils.isAuthenticated();
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      // await new Promise((resolve) => setTimeout(resolve, 1500));

      // // Generate mock token (replace with real API call)
      // const mockToken = `token_${email}_${Date.now()}`;

      // Save token
      // await authUtils.saveToken(mockToken);
      
      // Save user data
      // await authUtils.saveUserData({ email });

      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // const logout = async () => {
  //   try {
  //     setIsLoading(true);
  //     await authUtils.logout();
  //     setIsLoggedIn(false);
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //     throw error;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const value: AuthContextType = {
    isLoggedIn,
    isLoading,
    login,
    // logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
