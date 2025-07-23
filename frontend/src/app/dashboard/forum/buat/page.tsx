'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { forumApi } from '@/lib/api';
import {
  forumPostFormSchema,
  ForumPostFormData,
  ForumCategory,
  forumCategoryOptions,
} from '@/lib/types/forum';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

export default function CreateForumPostPage() {
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
  } = useForm<ForumPostFormData>({
    resolver: zodResolver(forumPostFormSchema),
    defaultValues: {
      title: '',
      content: '',
      category: undefined,
      isPinned: false,
      isLocked: false,
    },
  });

  const onSubmit = async (data: ForumPostFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Only Admin and RW can create pinned or locked posts
      if (!isAdmin && !isRW) {
        data.isPinned = false;
        data.isLocked = false;
      }

      await forumApi.createPost(data);
      router.push('/dashboard/forum');
    } catch (err: any) {
      console.error('Error creating forum post:', err);
      setError(err.response?.data?.message || 'Gagal membuat postingan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        <h1 className="text-2xl font-bold text-gray-800">Buat Diskusi Baru</h1>
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
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className={`block w-full px-3 py-2 border ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Judul diskusi..."
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
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
                  {/* For regular users, don't show PENGUMUMAN option */}
                  {forumCategoryOptions
                    .filter(option => (isAdmin || isRW) ? true : option.value !== ForumCategory.PENGUMUMAN)
                    .map((option) => (
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

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Konten <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              rows={8}
              className={`block w-full px-3 py-2 border ${
                errors.content ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Tulis konten diskusi di sini..."
              {...register('content')}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {/* Admin/RW Options */}
          {(isAdmin || isRW) && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900">Opsi Moderator</h3>
              
              <div className="flex items-center">
                <input
                  id="isPinned"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('isPinned')}
                />
                <label htmlFor="isPinned" className="ml-2 block text-sm text-gray-900">
                  Pin postingan ini (akan muncul di bagian atas)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="isLocked"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('isLocked')}
                />
                <label htmlFor="isLocked" className="ml-2 block text-sm text-gray-900">
                  Kunci postingan ini (tidak dapat dikomentari atau diedit)
                </label>
              </div>
            </div>
          )}

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
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 