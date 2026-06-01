import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, RegisterData } from '../types/auth';
import apiClient from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function saveSession(data: { id: number; firstName: string; lastName: string; email: string; pesel: string; token: string }) {
  const user: User = {
    id: String(data.id),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    pesel: data.pesel,
  };
  localStorage.setItem('rx_user',  JSON.stringify(user));
  localStorage.setItem('rx_token', data.token);
  return user;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('rx_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    setUser(saveSession(res.data));
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await apiClient.post('/auth/register', {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        pesel:     data.pesel,
        password:  data.password,
      });
      setUser(saveSession(res.data));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { errors?: Record<string, string> } } };
      const errors = axiosErr?.response?.data?.errors;
      throw { status: axiosErr?.response?.status, errors: errors ?? {} };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rx_user');
    localStorage.removeItem('rx_token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
