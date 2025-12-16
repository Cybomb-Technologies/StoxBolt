import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const baseURL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('user');

      if (adminToken && storedUser) {
        // Verify adminToken is still valid
        const response = await fetch(`${baseURL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const userData = JSON.parse(storedUser);
            // Merge with server data to ensure CRUD access is up-to-date
            const updatedUser = {
              ...userData,
              ...data.user,
              hasCRUDAccess: data.user.hasCRUDAccess || false
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } else {
            logout();
          }
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.adminToken && data.user) {
        const userData = {
          ...data.user,
          hasCRUDAccess: data.user.hasCRUDAccess || false,
          isSuperadmin: data.user.role === 'superadmin'
        };

        localStorage.setItem('adminToken', data.adminToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return { success: true, user: userData };
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/admin/login');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isSuperadmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin',
    hasCRUDAccess: user?.hasCRUDAccess || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};