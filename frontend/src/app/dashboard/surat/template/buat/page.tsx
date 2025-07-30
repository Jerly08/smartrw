'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { DocumentType, documentTypeOptions } from '@/lib/types/document';
import { FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Dynamically import the editor to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

// Form schema
const templateFormSchema = z.object({
  name: z.string().min(3, 'Nama template minimal 3 karakter'),
  type: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Jenis dokumen harus dipilih' }),
  }),
  content: z.string().min(10, 'Konten template minimal 10 karakter'),
  isDefault: z.boolean().default(false),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

// Editor toolbar configuration
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

export default function CreateTemplatePage() {
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
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      type: undefined,
      content: '',
      isDefault: false,
    },
  });

  useEffect(() => {
    if (!loading && user) {
      if (!isAdmin && !isRW) {
        // Redirect non-admin/RW users
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, isAdmin, isRW]);

  const onSubmit = async (data: TemplateFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // This would be replaced with an actual API call when implemented
      // await documentApi.createTemplate(data);
      
      console.log('Template data:', data);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push('/dashboard/surat/template');
    } catch (err: any) {
      console.error('Error creating template:', err);
      setError(err.response?.data?.message || 'Gagal membuat template. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Insert variable into editor
  const insertVariable = (variable: string) => {
    const editor = document.querySelector('.ql-editor');
    if (editor) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'bg-blue-100 text-blue-800 px-1 rounded';
        span.textContent = variable;
        range.deleteContents();
        range.insertNode(span);
      }
    }
  };

  if (!isAdmin && !isRW) {
    return null; // Prevent rendering for unauthorized users
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Buat Template Dokumen</h1>
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
          {/* Template Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Template <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              className={`block w-full px-3 py-2 border ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Contoh: Template Surat Domisili"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Document Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Dokumen <span className="text-red-500">*</span>
            </label>
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
                  <option value="">Pilih Jenis Dokumen</option>
                  {documentTypeOptions.map((option) => (
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

          {/* Is Default Template */}
          <div className="flex items-center">
            <input
              id="isDefault"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register('isDefault')}
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
              Jadikan sebagai template default untuk jenis dokumen ini
            </label>
          </div>

          {/* Template Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variabel Template
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                '[NAMA_LENGKAP]',
                '[NIK]',
                '[ALAMAT]',
                '[RT]',
                '[RW]',
                '[TANGGAL_LAHIR]',
                '[TEMPAT_LAHIR]',
                '[JENIS_KELAMIN]',
                '[AGAMA]',
                '[STATUS_PERKAWINAN]',
                '[PEKERJAAN]',
                '[TANGGAL_SURAT]',
                '[NOMOR_SURAT]',
              ].map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded"
                >
                  {variable}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Klik pada variabel untuk menyisipkannya ke dalam template
            </p>
          </div>

          {/* Template Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Konten Template <span className="text-red-500">*</span>
            </label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <div className={`border ${errors.content ? 'border-red-300' : 'border-gray-300'} rounded-md`}>
                  <ReactQuill
                    theme="snow"
                    modules={modules}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Masukkan konten template di sini..."
                    className="h-64"
                  />
                </div>
              )}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 