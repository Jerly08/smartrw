'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RegisterWargaForm from '@/components/forms/RegisterWargaForm';
import { useAuth } from '@/lib/auth';

export default function RegisterWargaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return <RegisterWargaForm />;
}
