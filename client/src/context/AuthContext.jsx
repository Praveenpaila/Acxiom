import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate active session on initial load
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authApi.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      // Not authenticated or session expired
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    setAuthError(null);
    try {
      const data = await authApi.login(credentials);
      if (data.success && data.user) {
        setUser(data.user);
        return data.user;
      }
      throw new Error(data.message || 'Login failed.');
    } catch (err) {
      const msg = err.customMessage || err.message || 'Invalid email or password.';
      setAuthError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const data = await authApi.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isAuthenticated: Boolean(user),
        login,
        logout,
        refreshUser,
        isAdmin: user?.role === 'Admin',
        isManager: user?.role === 'Manager',
        isSalesExecutive: user?.role === 'SalesExecutive',
      }}
    >
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
