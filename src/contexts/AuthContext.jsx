
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('finNewsUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // API call would go here: POST /api/auth/login
    // Mock implementation
    const mockUser = {
      id: '1',
      email,
      name: 'Admin User',
      role: 'Admin' // Admin, Editor, Writer
    };
    localStorage.setItem('finNewsUser', JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  };

  const logout = () => {
    localStorage.removeItem('finNewsUser');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'Admin',
    isEditor: user?.role === 'Editor' || user?.role === 'Admin',
    isWriter: user?.role === 'Writer' || user?.role === 'Editor' || user?.role === 'Admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
