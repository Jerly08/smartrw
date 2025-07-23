'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { socialAssistanceApi, residentApi } from '@/lib/api';
import { 
  SocialAssistance,
  SocialAssistanceRecipient,
  SocialAssistanceStatus,
  recipientFormSchema,
  RecipientFormData,
  RecipientFilter
} from '@/lib/types/socialAssistance';
import { Resident } from '@/lib/types/resident';
import { 
  FiUsers, 
  FiUserPlus, 
  FiSearch, 
  FiFilter, 
  FiCheck, 
  FiX, 
  FiArrowLeft,
  FiDownload,
  FiPackage,
  FiAlertCircle
} from 'react-icons/fi';
import Link from 'next/link';

export default function RecipientsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [program, setProgram] = useState<SocialAssistance | null>(null);
  const [recipients, setRecipients] = useState<SocialAssistanceRecipient[]>([]);
  const [availableResidents, setAvailableResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<RecipientFilter>({
    search: '',
    isVerified: undefined,
    hasReceived: undefined,
  });

  const programId = parseInt(params.id);
  
  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';
  const isWarga = user?.role === 'WARGA';

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RecipientFormData>({
    resolver: zodResolver(recipientFormSchema),
    defaultValues: {
      residentId: undefined,
      notes: '',
    },
  });

  useEffect(() => {
    if (!loading && user) {
      // Only Admin, RW, and RT can access this page
      if (isWarga) {
        router.push('/dashboard');
        return;
      }
      
      fetchProgram();
      fetchRecipients();
    }
  }, [programId, user, loading, router]);

  const fetchProgram = async () => {
    try {
      const data = await socialAssistanceApi.getSocialAssistanceById(programId);
      setProgram(data);
    } catch (error) {
      console.error('Error fetching social assistance program:', error);
      setError('Gagal memuat data program bantuan');
    }
  };

  const fetchRecipients = async () => {
    try {
      setIsLoading(true);
      const response = await socialAssistanceApi.getRecipients(programId, filters);
      setRecipients(response.recipients);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      setError('Gagal memuat data penerima bantuan');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableResidents = async () => {
    try {
      // Get all residents that are not already recipients
      const recipientIds = recipients.map(r => r.residentId);
      const params: any = { 
        isVerified: true,
        excludeIds: recipientIds.join(',')
      };
      
      // For RT, only show residents from their RT
      if (isRT && user?.resident?.rtNumber) {
        params.rtNumber = user.resident.rtNumber;
      }
      
      const response = await residentApi.getAllResidents(params);
      setAvailableResidents(response.residents);
    } catch (error) {
      console.error('Error fetching available residents:', error);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    if (e.target.name === 'isVerified' || e.target.name === 'hasReceived') {
      const value = e.target.value === '' ? undefined : e.target.value === 'true';
      setFilters({
        ...filters,
        [e.target.name]: value,
      });
    } else {
      setFilters({
        ...filters,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecipients();
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
    fetchAvailableResidents();
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    reset();
  };

  const onSubmit = async (data: RecipientFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await socialAssistanceApi.addRecipient(programId, data);
      fetchRecipients();
      setShowAddForm(false);
      reset();
    } catch (err: any) {
      console.error('Error adding recipient:', err);
      setError(err.response?.data?.message || 'Gagal menambahkan penerima. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRecipient = async (recipientId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus penerima ini?')) {
      return;
    }
    
    try {
      await socialAssistanceApi.removeRecipient(programId, recipientId);
      fetchRecipients();
    } catch (error) {
      console.error('Error removing recipient:', error);
      setError('Gagal menghapus penerima');
    }
  };

  const handleVerifyRecipient = async (recipientId: number) => {
    try {
      await socialAssistanceApi.verifyRecipient(programId, recipientId, { isVerified: true });
      fetchRecipients();
    } catch (error) {
      console.error('Error verifying recipient:', error);
      setError('Gagal memverifikasi penerima');
    }
  };

  const handleMarkAsReceived = async (recipientId: number) => {
    try {
      await socialAssistanceApi.markAsReceived(programId, recipientId, { 
        receivedDate: new Date().toISOString() 
      });
      fetchRecipients();
    } catch (error) {
      console.error('Error marking recipient as received:', error);
      setError('Gagal menandai penerima sebagai telah menerima bantuan');
    }
  };

  const canManageRecipients = () => {
    return isAdmin || isRW || (program?.status === SocialAssistanceStatus.DISIAPKAN);
  };

  const canVerifyRecipients = () => {
    return isAdmin || isRW || isRT;
  };

  const canMarkAsReceived = () => {
    return isAdmin || isRW || isRT;
  };

  if (loading || !program) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Penerima Bantuan</h1>
            <p className="text-gray-600">{program.name}</p>
          </div>
        </div>
        
        {/* Only show add button if program is in DISIAPKAN status */}
        {canManageRecipients() && !showAddForm && (
          <button
            onClick={handleShowAddForm}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiUserPlus className="mr-2" /> Tambah Penerima
          </button>
        )}
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

      {/* Add Recipient Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tambah Penerima Bantuan</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="residentId" className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Warga <span className="text-red-500">*</span>
              </label>
              <Controller
                name="residentId"
                control={control}
                render={({ field }) => (
                  <select
                    id="residentId"
                    className={`block w-full px-3 py-2 border ${
                      errors.residentId ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  >
                    <option value="">Pilih Warga</option>
                    {availableResidents.map((resident) => (
                      <option key={resident.id} value={resident.id}>
                        {resident.fullName} - NIK: {resident.nik} (RT {resident.rtNumber})
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.residentId && (
                <p className="mt-1 text-sm text-red-600">{errors.residentId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Catatan <span className="text-gray-500 font-normal">(Opsional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tambahkan catatan jika diperlukan..."
                {...register('notes')}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancelAdd}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Tambah Penerima'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
            <div className="relative">
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search || ''}
                onChange={handleFilterChange}
                placeholder="Cari berdasarkan nama atau NIK..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="isVerified" className="block text-sm font-medium text-gray-700 mb-1">Status Verifikasi</label>
            <div className="relative">
              <select
                id="isVerified"
                name="isVerified"
                value={filters.isVerified === undefined ? '' : String(filters.isVerified)}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Semua Status</option>
                <option value="true">Terverifikasi</option>
                <option value="false">Belum Terverifikasi</option>
              </select>
              <FiFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="hasReceived" className="block text-sm font-medium text-gray-700 mb-1">Status Penerimaan</label>
            <div className="relative">
              <select
                id="hasReceived"
                name="hasReceived"
                value={filters.hasReceived === undefined ? '' : String(filters.hasReceived)}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Semua Status</option>
                <option value="true">Sudah Menerima</option>
                <option value="false">Belum Menerima</option>
              </select>
              <FiFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="self-end flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Filter
            </button>
            
            <button
              type="button"
              onClick={() => socialAssistanceApi.exportRecipients(programId, filters)}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50"
            >
              <FiDownload className="inline mr-1" /> Unduh
            </button>
          </div>
        </form>
      </div>

      {/* Recipients List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : recipients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Belum ada penerima bantuan yang terdaftar
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warga
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RT
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Verifikasi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Penerimaan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catatan
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipients.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {recipient.resident?.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            NIK: {recipient.resident?.nik}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">RT {recipient.resident?.rtNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {recipient.isVerified ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Belum Terverifikasi
                        </span>
                      )}
                      {recipient.verifiedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          oleh: {recipient.verifiedBy}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {recipient.receivedDate ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Sudah Menerima
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Belum Menerima
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {recipient.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {/* Verify button for Admin, RW, RT */}
                        {canVerifyRecipients() && !recipient.isVerified && (
                          <button
                            onClick={() => handleVerifyRecipient(recipient.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <FiCheck className="h-5 w-5" />
                          </button>
                        )}
                        
                        {/* Mark as received button for Admin, RW, RT */}
                        {canMarkAsReceived() && recipient.isVerified && !recipient.receivedDate && (
                          <button
                            onClick={() => handleMarkAsReceived(recipient.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FiPackage className="h-5 w-5" />
                          </button>
                        )}
                        
                        {/* Remove button for Admin, RW */}
                        {canManageRecipients() && (
                          <button
                            onClick={() => handleRemoveRecipient(recipient.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 