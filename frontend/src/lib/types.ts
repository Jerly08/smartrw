import { z } from 'zod';
import { Resident as FullResident } from './types/resident';

// User role enum
export enum Role {
  ADMIN = 'ADMIN',
  RW = 'RW',
  RT = 'RT',
  WARGA = 'WARGA',
}

// User interface
export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  resident?: FullResident;
}

// Resident interface (simplified) - for backward compatibility
export interface Resident {
  id: number;
  nik: string;
  fullName: string;
  // Other resident fields as needed
}

// Auth response interface
export interface AuthResponse {
  user: User;
  token: string;
}

// Login form schema
export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register form schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak sama',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>; 