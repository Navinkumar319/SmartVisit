import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch and sync fresh profile data from database
  const refreshProfile = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const response = await api.get('/api/auth/me');
        const data = response.data;
        setUser({
          token,
          role: data.role,
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          mobile: data.mobile,
          profilePhoto: data.profilePhoto
        });
      } catch (err) {
        console.error('Failed to refresh user profile from database:', err);
        // Fallback to local storage parameters
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username');
        const fullName = localStorage.getItem('fullName');
        if (role && username && fullName) {
          setUser({ token, role, username, fullName });
        }
      }
    }
  };

  // Initialize session from local storage on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await refreshProfile();
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  // Login action
  const login = async (username, password) => {
    try {
      const response = await api.post('/api/auth/login', { username, password });
      const data = response.data;
      
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', data.username);
      localStorage.setItem('fullName', data.fullName);

      api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      
      let email = '';
      let mobile = '';
      let profilePhoto = '';
      try {
        const meRes = await api.get('/api/auth/me');
        email = meRes.data.email;
        mobile = meRes.data.mobile;
        profilePhoto = meRes.data.profilePhoto;
      } catch (meErr) {
        console.error('Failed to get fresh credentials on login:', meErr);
      }

      setUser({
        token: data.accessToken,
        role: data.role,
        username: data.username,
        fullName: data.fullName,
        email,
        mobile,
        profilePhoto
      });

      return { success: true, role: data.role };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    setUser(null);
  };

  // Signup action (Reception/Security)
  const signup = async (formData) => {
    try {
      await api.post('/api/auth/signup', formData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Sign up failed. Please try again.';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, refreshProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
