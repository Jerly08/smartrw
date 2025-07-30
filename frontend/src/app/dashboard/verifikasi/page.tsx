
'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import VerificationForm from '@/components/auth/VerificationForm';
import { FiCheckCircle } from 'react-icons/fi';

export default function VerificationPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Akun</h1>
            <p className="text-gray-600">
              Verifikasi akun Anda untuk mendapatkan akses penuh ke layanan Smart RW.
            </p>
          </div>
          
          {user.resident?.isVerified ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <FiCheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Akun Sudah Terverifikasi
              </h3>
              <p className="text-green-700">
                Akun Anda telah berhasil diverifikasi. Anda dapat menggunakan semua layanan yang tersedia.
              </p>
            </div>
          ) : (
            <VerificationForm />
          )}
        </div>
      </div>
    </div>
  );
}

