import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi, logoutApi, getStoredToken, getStoredUser, setAuthSession, clearAuthSession } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore and verify session on initial load
    async function initAuth() {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken) {
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }

        // Verify token with backend /api/auth/me
        try {
          const res = await getMeApi();
          if (res.success && res.user) {
            setUser(res.user);
            setIsAuthenticated(true);
            setAuthSession(storedToken, res.user);
          }
        } catch (err) {
          console.warn("Session expired or invalid:", err.message);
          // If token verification fails with 401, clear session
          if (err.status === 401) {
            clearAuthSession();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      return res.user;
    }
    throw new Error(res.error || 'Login failed');
  };

  const signup = async (userData) => {
    const res = await registerApi(userData);
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      return res.user;
    }
    throw new Error(res.error || 'Registration failed');
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('prepNova_user', JSON.stringify(updatedUser));
  };

  if (loading) {
    return null; // Or loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout, updateProfile }}>
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
