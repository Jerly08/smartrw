'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { eventApi, rtApi } from '@/lib/api';
import { 
  eventFormSchemaWithDateValidation, 
  EventFormData, 
  eventCategoryOptions,
  Event
} from '@/lib/types/event';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string);
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableRTs, setAvailableRTs] = useState<string[]>([]);
  const [event, setEvent] = useState<Event | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchemaWithDateValidation),
  });

  useEffect(() => {
    if (!loading && user) {
      // Only Admin, RW, and RT can edit events
      if (!isAdmin && !isRW && !isRT) {
        router.push('/dashboard');
        return;
      }

      // Fetch the event data
      fetchEventData();
      
      // Fetch available RTs (for Admin and RW)
      if (isAdmin || isRW) {
        fetchAvailableRTs();
      }
    }
  }, [user, loading, router, eventId]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      const eventData = await eventApi.getEventById(eventId);
      setEvent(eventData);

      // Parse targetRTs from JSON string
      let targetRTs: string[] = [];
      if (eventData.targetRTs) {
        try {
          targetRTs = JSON.parse(eventData.targetRTs);
        } catch (e) {
          console.error('Error parsing targetRTs:', e);
        }
      }

      // Format dates for datetime-local input
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Set form values
      reset({
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        startDate: formatDateForInput(eventData.startDate),
        endDate: eventData.endDate ? formatDateForInput(eventData.endDate) : '',
        category: eventData.category,
        targetRTs: targetRTs,
        isPublished: eventData.isPublished,
      });

      // Check if user can edit this event
      if (eventData.createdBy !== user?.id && !isAdmin && !isRW) {
        setError('Anda tidak memiliki izin untuk mengedit kegiatan ini');
        return;
      }

    } catch (err: any) {
      console.error('Error fetching event data:', err);
      setError('Gagal memuat data kegiatan');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableRTs = async () => {
    try {
      const response = await rtApi.getAllRTs({ limit: 50 });
      const rtNumbers = response.rts.map((rt: any) => rt.number);
      setAvailableRTs(rtNumbers);
    } catch (error) {
      console.error('Error fetching RTs:', error);
      // Fallback to mock data if API fails
      setAvailableRTs(['001', '002', '003', '004', '005']);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // If RT user, force target to their RT
      if (isRT && user?.resident?.rtNumber) {
        data.targetRTs = [user.resident.rtNumber];
      }

      console.log('=== FRONTEND EVENT UPDATE DEBUG ===');
      console.log('Form data before API call:', data);
      console.log('Event ID:', eventId);
      console.log('User info:', { id: user?.id, role: user?.role, rtNumber: user?.resident?.rtNumber });
      console.log('Stringified data:', JSON.stringify(data, null, 2));
      console.log('=== END FRONTEND DEBUG ===');

      await eventApi.updateEvent(eventId, data);
      router.push('/dashboard/kegiatan');
    } catch (err: any) {
      console.error('Error updating event:', err);
      setError(err.response?.data?.message || 'Gagal memperbarui kegiatan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTargetRTChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    setValue('targetRTs', selectedValues);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Kegiatan tidak ditemukan</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isRW && !isRT) {
    return null; // Prevent rendering for unauthorized users
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Kegiatan</h1>
        </div>
        <button
          onClick={() => router.push('/dashboard/kegiatan')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Kembali ke Daftar
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
          {/* Event Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Judul Kegiatan <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className={`block w-full px-3 py-2 border ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Contoh: Kerja Bakti Lingkungan RT 001"
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Event Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Kategori <span className="text-red-500">*</span>
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <select
                  id="category"
                  className={`block w-full px-3 py-2 border ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  {...field}
                >
                  <option value="">Pilih Kategori</option>
                  {eventCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Event Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Lokasi <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="location"
                type="text"
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Contoh: Balai RW 01"
                {...register('location')}
              />
            </div>
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          {/* Event Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal & Waktu Mulai <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="startDate"
                  type="datetime-local"
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
                Tanggal & Waktu Selesai
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiClock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="endDate"
                  type="datetime-local"
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

          {/* Target RT */}
          <div>
            <label htmlFor="targetRTs" className="block text-sm font-medium text-gray-700 mb-1">
              Target RT
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUsers className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="targetRTs"
                multiple
                className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                onChange={handleTargetRTChange}
                disabled={isRT} // RT users can't change target
                size={Math.min(availableRTs.length, 5)}
              >
                {availableRTs.map((rt) => (
                  <option 
                    key={rt} 
                    value={rt} 
                    selected={
                      (isRT && user?.resident?.rtNumber === rt) ||
                      (event?.targetRTs && JSON.parse(event.targetRTs || '[]').includes(rt))
                    }
                  >
                    RT {rt}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {isRT
                ? 'Sebagai RT, kegiatan ini hanya untuk RT Anda'
                : 'Tahan tombol Ctrl untuk memilih beberapa RT. Kosongkan untuk semua RT.'}
            </p>
          </div>

          {/* Event Description */}
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
              placeholder="Jelaskan detail kegiatan..."
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Publish Status */}
          <div className="flex items-center">
            <input
              id="isPublished"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register('isPublished')}
            />
            <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
              Publikasikan kegiatan sekarang
            </label>
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
              {isSubmitting ? 'Menyimpan...' : 'Perbarui Kegiatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
