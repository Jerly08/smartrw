'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/forms/LoginForm';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    console.log('Login page effect - user:', user, 'loading:', loading);
    if (user && !loading) {
      console.log('User already logged in, redirecting to dashboard from login page');
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                RW
              </div>
              <span className="ml-2 text-2xl font-bold text-blue-600">Smart RW</span>
            </div>
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </div>
  );
} 