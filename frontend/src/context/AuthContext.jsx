import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session automatically on page refresh
    const storedUser = localStorage.getItem('prepNova_user');
    const storedToken = localStorage.getItem('prepNova_token');

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.university === 'Indus University') {
          parsed.university = 'DAU';
          localStorage.setItem('prepNova_user', JSON.stringify(parsed));
        }
        setUser(parsed);
        setIsAuthenticated(true);
      } catch {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock authentication logic
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password.length >= 6) {
          const mockUser = {
            name: email.split('@')[0],
            email: email,
            university: 'DAU',
            course: 'B.Tech Computer Science',
            preferredRole: 'Frontend Developer',
            avatar: email[0].toUpperCase(),
            joinedAt: new Date().toISOString(),
          };
          const token = 'mock_jwt_token_12345';

          localStorage.setItem('prepNova_user', JSON.stringify(mockUser));
          localStorage.setItem('prepNova_token', token);

          setUser(mockUser);
          setIsAuthenticated(true);
          resolve(mockUser);
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 800);
    });
  };

  const signup = async (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          name: userData.name,
          email: userData.email,
          university: userData.university || 'DAU',
          course: userData.course || 'B.Tech Computer Science',
          preferredRole: 'Frontend Developer',
          avatar: userData.name.charAt(0).toUpperCase(),
          joinedAt: new Date().toISOString(),
        };
        const token = 'mock_jwt_token_12345';

        localStorage.setItem('prepNova_user', JSON.stringify(newUser));
        localStorage.setItem('prepNova_token', token);

        setUser(newUser);
        setIsAuthenticated(true);
        resolve(newUser);
      }, 800);
    });
  };

  const logout = () => {
    localStorage.removeItem('prepNova_user');
    localStorage.removeItem('prepNova_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('prepNova_user', JSON.stringify(updatedUser));
  };

  if (loading) {
    return null; // Or a global loading spinner
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
