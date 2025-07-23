'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { complaintApi } from '@/lib/api';
import { 
  Complaint, 
  ComplaintStatus, 
  complaintStatusOptions, 
  responseFormSchema, 
  ResponseFormData 
} from '@/lib/types/complaint';
import { FiMessageCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

export default function RespondToComplaintPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complaintId = parseInt(params.id);
  
  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ResponseFormData>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      response: '',
      status: ComplaintStatus.DITINDAKLANJUTI,
    },
  });

  useEffect(() => {
    if (!loading && user) {
      // Only Admin, RW, and RT can respond to complaints
      if (!isAdmin && !isRW && !isRT) {
        router.push('/dashboard');
        return;
      }

      fetchComplaint();
    }
  }, [user, loading, router]);

  const fetchComplaint = async () => {
    try {
      setIsLoading(true);
      const data = await complaintApi.getComplaintById(complaintId);
      setComplaint(data);
      
      // Pre-fill response if exists
      if (data.response) {
        setValue('response', data.response);
      }
      
      // Pre-fill status
      if (data.status) {
        setValue('status', data.status);
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      setError('Gagal memuat data pengaduan');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ResponseFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await complaintApi.respondToComplaint(complaintId, data);
      router.push(`/dashboard/pengaduan/${complaintId}`);
    } catch (err: any) {
      console.error('Error responding to complaint:', err);
      setError(err.response?.data?.message || 'Gagal mengirim tanggapan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">Pengaduan tidak ditemukan</p>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Tanggapi Pengaduan</h1>
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

      {/* Complaint Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{complaint.title}</h2>
        <p className="text-gray-600 line-clamp-3">{complaint.description}</p>
      </div>

      {/* Response Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Response Text */}
          <div>
            <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggapan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3">
                <FiMessageCircle className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="response"
                rows={5}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.response ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Tulis tanggapan Anda..."
                {...register('response')}
              />
            </div>
            {errors.response && (
              <p className="mt-1 text-sm text-red-600">{errors.response.message}</p>
            )}
          </div>

          {/* Status Selection */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <select
                  id="status"
                  className={`block w-full px-3 py-2 border ${
                    errors.status ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  {...field}
                >
                  {complaintStatusOptions
                    .filter(option => option.value !== ComplaintStatus.DITERIMA) // Filter out DITERIMA status
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              )}
            />
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
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
              {isSubmitting ? 'Menyimpan...' : 'Kirim Tanggapan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 