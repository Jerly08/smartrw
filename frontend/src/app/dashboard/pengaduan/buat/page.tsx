'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { complaintApi } from '@/lib/api';
import { 
  complaintFormSchema, 
  ComplaintFormData, 
  complaintCategoryOptions 
} from '@/lib/types/complaint';
import { FiMapPin, FiAlertCircle, FiPaperclip, FiX } from 'react-icons/fi';

export default function CreateComplaintPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: {
      title: '',
      category: undefined,
      description: '',
      location: '',
      attachments: [],
    },
  });

  const onSubmit = async (data: ComplaintFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Add selected files to form data
      const formData = {
        ...data,
        attachments: selectedFiles,
      };

      await complaintApi.createComplaint(formData);
      router.push('/dashboard/pengaduan');
    } catch (err: any) {
      console.error('Error creating complaint:', err);
      setError(err.response?.data?.message || 'Gagal membuat pengaduan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Buat Pengaduan Baru</h1>
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
          {/* Complaint Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Judul Pengaduan <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className={`block w-full px-3 py-2 border ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Contoh: Jalan Rusak di RT 001"
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Complaint Category */}
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
                  {complaintCategoryOptions.map((option) => (
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

          {/* Complaint Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Lokasi
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
                placeholder="Contoh: Jalan Merdeka No. 10"
                {...register('location')}
              />
            </div>
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          {/* Complaint Description */}
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
              placeholder="Jelaskan detail pengaduan Anda..."
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* File Attachments */}
          <div>
            <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">
              Lampiran (Opsional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FiPaperclip className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                  >
                    <span>Unggah file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </label>
                  <p className="pl-1">atau seret dan lepas</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, PDF hingga 10MB
                </p>
              </div>
            </div>
            
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700">File yang dipilih:</h4>
                <ul className="mt-2 divide-y divide-gray-200">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="py-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <FiPaperclip className="mr-2 h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-500">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
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
              {isSubmitting ? 'Menyimpan...' : 'Kirim Pengaduan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 