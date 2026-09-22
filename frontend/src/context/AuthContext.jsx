import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in when the app loads
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      // Also fetch full live profile if possible. Only flip `loading` to
      // false once this settles, so route guards don't see a moment of
      // "not loading, no user" and bounce a logged-in user to /login.
      api.get('auth/profile/')
        .then(res => {
          setUser({ ...decoded, ...res.data });
        })
        .catch(() => {
          setUser(decoded);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const response = await api.post('auth/login/', { identifier, password });
    localStorage.setItem('access', response.data.access);
    localStorage.setItem('refresh', response.data.refresh);
    
    const decoded = jwtDecode(response.data.access);
    const userData = response.data.user ? { ...decoded, ...response.data.user } : decoded;
    setUser(userData);
    
    // Redirect based on role
    if (userData.role === 'RECRUITER') {
      navigate('/recruiter-dashboard');
    } else {
      navigate('/');
    }
    return userData;
  };

  const register = async (userData) => {
    await api.post('auth/register/', userData);
    navigate('/login');
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
    navigate('/login');
  };

  const updateUser = (newUserData) => {
    setUser(prev => prev ? { ...prev, ...newUserData } : newUserData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};