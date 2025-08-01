'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { socialAssistanceApi } from '@/lib/api';
import { 
  SocialAssistance,
  SocialAssistanceFormData, 
  socialAssistanceFormSchema,
  socialAssistanceTypeOptions
} from '@/lib/types/socialAssistance';
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi';

export default function EditSocialAssistancePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [program, setProgram] = useState<SocialAssistance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const programId = parseInt(params.id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SocialAssistanceFormData>({
    resolver: zodResolver(socialAssistanceFormSchema),
  });

  useEffect(() => {
    if (!loading && user) {
      // Only Admin and RW can edit programs
      if (!['ADMIN', 'RW'].includes(user.role)) {
        router.push('/dashboard/bantuan');
        return;
      }
      
      fetchProgram();
    }
  }, [programId, user, loading, router]);

  const fetchProgram = async () => {
    try {
      setIsLoading(true);
      const data = await socialAssistanceApi.getSocialAssistanceById(programId);
      setProgram(data);
      
      // Reset form with existing data
      reset({
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate).toISOString().split('T')[0],
        endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        source: data.source,
        type: data.type,
      });
    } catch (error) {
      console.error('Error fetching program:', error);
      setError('Gagal memuat data program bantuan');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SocialAssistanceFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await socialAssistanceApi.updateSocialAssistance(programId, data);
      
      router.push(`/dashboard/bantuan/${programId}`);
    } catch (err: any) {
      console.error('Error updating program:', err);
      setError(err.response?.data?.message || 'Gagal memperbarui program bantuan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !program) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiX className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Program Bantuan</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiX className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nama Program <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  className={`block w-full px-3 py-2 border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Masukkan nama program bantuan"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Deskripsi <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={4}
                  className={`block w-full px-3 py-2 border ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Masukkan deskripsi program bantuan"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Jenis Bantuan <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="type"
                      className={`block w-full px-3 py-2 border ${
                        errors.type ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      {...field}
                    >
                      <option value="">Pilih Jenis Bantuan</option>
                      {socialAssistanceTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                Sumber Dana <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="source"
                  className={`block w-full px-3 py-2 border ${
                    errors.source ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Contoh: Pemerintah Daerah"
                  {...register('source')}
                />
                {errors.source && (
                  <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  id="startDate"
                  className={`block w-full px-3 py-2 border ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Tanggal Berakhir <span className="text-gray-500 font-normal">(Opsional)</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  id="endDate"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register('endDate')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <FiSave className="inline mr-2" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
