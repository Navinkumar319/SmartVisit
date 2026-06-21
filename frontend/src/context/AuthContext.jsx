import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from local storage on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const fullName = localStorage.getItem('fullName');

    if (token && role && username && fullName) {
      setUser({ token, role, username, fullName });
    }
    setLoading(false);
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

      setUser({
        token: data.accessToken,
        role: data.role,
        username: data.username,
        fullName: data.fullName
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
    <AuthContext.Provider value={{ user, login, logout, signup, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
