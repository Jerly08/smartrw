'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { complaintApi } from '@/lib/api';
import { 
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  complaintFormSchema, 
  ComplaintFormData, 
  complaintCategoryOptions 
} from '@/lib/types/complaint';
import { FiMapPin, FiAlertCircle, FiPaperclip, FiX } from 'react-icons/fi';

export default function EditComplaintPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);

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

  useEffect(() => {
    if (!loading && user) {
      fetchComplaint();
    }
  }, [complaintId, user, loading]);

  const fetchComplaint = async () => {
    try {
      setIsLoading(true);
      const data = await complaintApi.getComplaintById(complaintId);
      setComplaint(data);
      
      // Check if user has permission to edit
      const canEdit = isAdmin || isRW || isRT || 
        (data.createdBy === user?.id && data.status === ComplaintStatus.DITERIMA);
      
      if (!canEdit) {
        router.push('/dashboard/pengaduan');
        return;
      }
      
      // Pre-fill form data
      setValue('title', data.title);
      setValue('category', data.category);
      setValue('description', data.description);
      if (data.location) {
        setValue('location', data.location);
      }
      
      // Parse existing attachments
      if (data.attachments) {
        try {
          const attachments = JSON.parse(data.attachments);
          if (Array.isArray(attachments)) {
            setExistingAttachments(attachments);
          }
        } catch (e) {
          console.error('Error parsing attachments:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      setError('Gagal memuat data pengaduan');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ComplaintFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Add selected files to form data
      const formData = {
        ...data,
        attachments: selectedFiles,
        existingAttachments: existingAttachments,
      };

      await complaintApi.updateComplaint(complaintId, formData);
      router.push(`/dashboard/pengaduan/${complaintId}`);
    } catch (err: any) {
      console.error('Error updating complaint:', err);
      setError(err.response?.data?.message || 'Gagal memperbarui pengaduan. Silakan coba lagi.');
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

  const removeExistingAttachment = (index: number) => {
    const newAttachments = [...existingAttachments];
    newAttachments.splice(index, 1);
    setExistingAttachments(newAttachments);
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
        <h1 className="text-2xl font-bold text-gray-800">Edit Pengaduan</h1>
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

          {/* Existing Attachments */}
          {existingAttachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lampiran yang Ada
              </label>
              <ul className="mt-2 divide-y divide-gray-200">
                {existingAttachments.map((attachment, index) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);
                  const fileName = attachment.split('/').pop() || `Lampiran ${index + 1}`;
                  
                  return (
                    <li key={index} className="py-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <FiPaperclip className="mr-2 h-5 w-5 text-gray-400" />
                        <a 
                          href={attachment} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:text-blue-700"
                        >
                          {fileName}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* File Attachments */}
          <div>
            <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">
              Tambah Lampiran Baru (Opsional)
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
                <h4 className="text-sm font-medium text-gray-700">File baru yang dipilih:</h4>
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 