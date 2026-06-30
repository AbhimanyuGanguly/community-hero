import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await API.getMe();
      setUser(userData);
    } catch (err) {
      console.error("Auth refresh failed:", err);
      localStorage.removeItem('ch_token');
      setUser(null);
    }
  };

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('ch_token');
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await API.login(email, password);
    localStorage.setItem('ch_token', data.token);
    // data.user from login doesn't include badges/stats, so fetch full user
    await refreshUser();
    return data.user;
  };

  const signup = async (name, email, password) => {
    const data = await API.signup(name, email, password);
    localStorage.setItem('ch_token', data.token);
    // data.user from signup doesn't include badges/stats, so fetch full user
    await refreshUser();
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('ch_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
