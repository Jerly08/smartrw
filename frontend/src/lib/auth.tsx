'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from './types';
import { authApi } from './api';
import { getMockUser } from './mock-auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is logged in on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    console.log('Initial token check:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        console.log('Fetching user profile');
        const userData = await authApi.getProfile();
        console.log('User profile fetched:', userData);
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Attempting login for:', email);
      const { user, token } = await authApi.login({ email, password });
      console.log('Login successful, user:', user);
      console.log('Token received:', token ? 'Yes' : 'No');
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        console.log('Token saved to localStorage');
      }
      
      setUser(user);
      console.log('User state updated, redirecting to dashboard');
      
      // Coba gunakan window.location untuk navigasi hard
      if (typeof window !== 'undefined') {
        console.log('Using window.location.href for navigation');
        window.location.href = '/dashboard';
      } else {
        // Fallback ke router jika window tidak tersedia
        router.replace('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Attempting registration for:', email);
      const { user, token } = await authApi.register({ name, email, password, confirmPassword: password });
      console.log('Registration successful, user:', user);
      console.log('Token received:', token ? 'Yes' : 'No');
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        console.log('Token saved to localStorage');
      }
      
      setUser(user);
      console.log('User state updated, redirecting to dashboard');
      
      // Coba gunakan window.location untuk navigasi hard
      if (typeof window !== 'undefined') {
        console.log('Using window.location.href for navigation');
        window.location.href = '/dashboard';
      } else {
        // Fallback ke router jika window tidak tersedia
        router.replace('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      console.log('Token removed from localStorage');
      
      // Gunakan window.location untuk logout
      console.log('Using window.location.href for logout navigation');
      window.location.href = '/login';
    } else {
      setUser(null);
      router.replace('/login');
    }
  };

  const contextValue = { user, loading, error, login, register, logout };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 