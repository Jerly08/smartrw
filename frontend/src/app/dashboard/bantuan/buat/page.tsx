'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { socialAssistanceApi } from '@/lib/api';
import { 
  socialAssistanceFormSchemaWithDateValidation, 
  SocialAssistanceFormData, 
  socialAssistanceTypeOptions 
} from '@/lib/types/socialAssistance';
import { FiCalendar, FiAlertCircle, FiPackage, FiUser } from 'react-icons/fi';

export default function CreateSocialAssistancePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SocialAssistanceFormData>({
    resolver: zodResolver(socialAssistanceFormSchemaWithDateValidation),
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      source: '',
      type: undefined,
    },
  });

  useEffect(() => {
    if (!loading && user) {
      // Only Admin and RW can create social assistance programs
      if (!isAdmin && !isRW) {
        router.push('/dashboard/bantuan');
        return;
      }
    }
  }, [user, loading, router, isAdmin, isRW]);

  const onSubmit = async (data: SocialAssistanceFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await socialAssistanceApi.createSocialAssistance(data);
      router.push('/dashboard/bantuan');
    } catch (err: any) {
      console.error('Error creating social assistance program:', err);
      setError(err.response?.data?.message || 'Gagal membuat program bantuan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || (!isAdmin && !isRW)) {
    return null; // Don't render anything while loading or if unauthorized
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Buat Program Bantuan Baru</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Kembali
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Program Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Program <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              className={`block w-full px-3 py-2 border ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Contoh: Bantuan Sembako RT 001"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Program Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Bantuan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPackage className="h-5 w-5 text-gray-400" />
              </div>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select
                    id="type"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.type ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    {...field}
                  >
                    <option value="">Pilih Tipe Bantuan</option>
                    {socialAssistanceTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Source */}
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
              Sumber Bantuan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="source"
                type="text"
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.source ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Contoh: Pemerintah Daerah, Donatur, Kas RW"
                {...register('source')}
              />
            </div>
            {errors.source && (
              <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="startDate"
                  type="date"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  {...register('startDate')}
                />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Selesai <span className="text-gray-500 font-normal">(Opsional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="endDate"
                  type="date"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.endDate ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  {...register('endDate')}
                />
              </div>
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              className={`block w-full px-3 py-2 border ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Jelaskan detail program bantuan..."
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 