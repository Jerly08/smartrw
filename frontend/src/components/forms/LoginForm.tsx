'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { LoginFormData, loginSchema } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function LoginForm() {
  const { login, loading, error } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('Login form submitted with data:', data);
    try {
      await login(data.email, data.password);
      console.log('Login function completed');
    } catch (error) {
      console.error('Error during login form submission:', error);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Login Smart RW</h1>
        <p className="mt-2 text-gray-600">
          Masuk ke akun Anda untuk mengakses layanan Smart RW
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="nama@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Masukkan password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Lupa password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={loading}>
          Masuk
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Belum memiliki akun?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Daftar disini
          </Link>
        </p>
      </div>
    </div>
  );
} 