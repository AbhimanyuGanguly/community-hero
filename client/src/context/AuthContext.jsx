import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('ch_user');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { return null; }
    }
    return null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ch_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      API.getMe()
        .then(u => {
          setUser(u);
          localStorage.setItem('ch_user', JSON.stringify(u));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await API.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ch_token', data.token);
    localStorage.setItem('ch_user', JSON.stringify(data.user));
    return data.user;
  };

  const signup = async (name, email, password) => {
    const data = await API.signup(name, email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ch_token', data.token);
    localStorage.setItem('ch_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ch_token');
    localStorage.removeItem('ch_user');
  };

  const refreshUser = async () => {
    if (!token) return null;
    try {
      const u = await API.getMe();
      setUser(u);
      localStorage.setItem('ch_user', JSON.stringify(u));
      return u;
    } catch (e) {
      logout();
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token && !!user, login, signup, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
