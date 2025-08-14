'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { authApi } from '@/lib/api';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function PasswordChangeModal({ isOpen, onClose }: PasswordChangeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      setIsLoading(true);
      
      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        toast.error('Password baru dan konfirmasi password tidak sama');
        return;
      }
      
      // Call API to change password
      const response = await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (response.success) {
        toast.success('Password berhasil diubah');
        reset();
        onClose();
      } else {
        toast.error(response.message || 'Gagal mengubah password');
      }
    } catch (error: any) {
      console.error('Gagal mengubah password:', error);
      toast.error(error.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Ubah Password
                </h3>
                <div className="mt-4">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                          Password Saat Ini
                        </label>
                        <input
                          id="currentPassword"
                          type="password"
                          {...register('currentPassword', { required: 'Password saat ini wajib diisi' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.currentPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                          Password Baru
                        </label>
                        <input
                          id="newPassword"
                          type="password"
                          {...register('newPassword', { 
                            required: 'Password baru wajib diisi',
                            minLength: { value: 6, message: 'Password minimal 6 karakter' }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.newPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          Konfirmasi Password Baru
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          {...register('confirmPassword', { 
                            required: 'Konfirmasi password wajib diisi',
                            minLength: { value: 6, message: 'Password minimal 6 karakter' }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
