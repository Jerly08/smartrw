'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import PasswordChangeModal from '@/components/profile/PasswordChangeModal';
import { authApi } from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
    }
  });

  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('phoneNumber', user.resident?.phoneNumber || '');
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await authApi.updateProfile(data);
      toast.success('Profil berhasil diperbarui');
      setIsEditing(false);
      
      // Reload page to refresh user data
      window.location.reload();
    } catch (error) {
      toast.error('Gagal memperbarui profil');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Pengaturan Profil</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                Edit Profil
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nama
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Nama wajib diisi' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email wajib diisi',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Format email tidak valid',
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Nomor Telepon
                </label>
                <input
                  id="phoneNumber"
                  type="text"
                  {...register('phoneNumber')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-70"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition disabled:opacity-70"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Informasi Akun</h3>
                    
                    <div className="mt-2">
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">Nama:</span>
                        <p className="font-medium">{user.name}</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">Email:</span>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">Role:</span>
                        <p className="font-medium">{user.role}</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">Terdaftar pada:</span>
                        <p className="font-medium">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {user.resident && (
                  <div className="md:w-1/2 space-y-4 mt-6 md:mt-0">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Informasi Penduduk</h3>
                      
                      <div className="mt-2">
                        <div className="mb-2">
                          <span className="text-sm text-gray-500">NIK:</span>
                          <p className="font-medium">{user.resident.nik || '-'}</p>
                        </div>
                        <div className="mb-2">
                          <span className="text-sm text-gray-500">Nama Lengkap:</span>
                          <p className="font-medium">{user.resident.fullName || '-'}</p>
                        </div>
                        <div className="mb-2">
                          <span className="text-sm text-gray-500">RT/RW:</span>
                          <p className="font-medium">{`${user.resident.rtNumber || '-'}/${user.resident.rwNumber || '-'}`}</p>
                        </div>
                        <div className="mb-2">
                          <span className="text-sm text-gray-500">Status Verifikasi:</span>
                          <p className={`font-medium ${user.resident.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                            {user.resident.isVerified ? 'Terverifikasi' : 'Belum Diverifikasi'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Keamanan Akun</h3>
                <div className="mt-2">
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  >
                    Ubah Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </>
  );
} 