import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface AuthContextType {
  token: string | null;
  login: (usuario: string, clave: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const navigate = useNavigate();

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/token/', { username, password });
      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);
      api.defaults.headers['Authorization'] = 'Bearer ' + access;
      navigate('/');
    } catch (error) {
      console.error("Erro no login:", error);
      throw new Error('Falha ao autenticar. Verifique usuário e senha.');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    delete api.defaults.headers['Authorization'];
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}