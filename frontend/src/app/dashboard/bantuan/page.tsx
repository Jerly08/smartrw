'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { socialAssistanceApi } from '@/lib/api';
import { 
  SocialAssistance, 
  SocialAssistanceType, 
  SocialAssistanceStatus, 
  socialAssistanceTypeOptions, 
  socialAssistanceStatusOptions 
} from '@/lib/types/socialAssistance';
import { 
  FiPackage, 
  FiCalendar, 
  FiUsers, 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit, 
  FiTrash, 
  FiEye, 
  FiCheck,
  FiX,
  FiDownload
} from 'react-icons/fi';
import Link from 'next/link';

export default function SocialAssistancePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [programs, setPrograms] = useState<SocialAssistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
  });

  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';
  const isWarga = user?.role === 'WARGA';

  useEffect(() => {
    if (!loading && user) {
      // Only Admin, RW, and RT can access this page
      if (isWarga) {
        router.push('/dashboard');
        return;
      }
      
      fetchPrograms();
    }
  }, [user, loading, router]);

  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      const params: any = { ...filters };
      
      // For RT, only show programs targeting their RT
      if (isRT && user?.resident?.rtNumber) {
        params.rtNumber = user.resident.rtNumber;
      }
      
      const response = await socialAssistanceApi.getAllSocialAssistance(params);
      setPrograms(response.socialAssistance);
    } catch (error) {
      console.error('Error fetching social assistance programs:', error);
      setError('Gagal memuat data bantuan sosial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrograms();
  };

  const handleDeleteProgram = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus program bantuan ini?')) {
      return;
    }
    
    try {
      await socialAssistanceApi.deleteSocialAssistance(id);
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting social assistance program:', error);
      setError('Gagal menghapus program bantuan');
    }
  };

  const handleUpdateStatus = async (id: number, status: SocialAssistanceStatus) => {
    try {
      await socialAssistanceApi.updateSocialAssistanceStatus(id, status);
      fetchPrograms();
    } catch (error) {
      console.error('Error updating social assistance status:', error);
      setError('Gagal memperbarui status program bantuan');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getTypeLabel = (type: SocialAssistanceType) => {
    const typeOption = socialAssistanceTypeOptions.find(option => option.value === type);
    return typeOption?.label || type;
  };

  const getTypeColor = (type: SocialAssistanceType) => {
    const typeOption = socialAssistanceTypeOptions.find(option => option.value === type);
    return typeOption?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: SocialAssistanceStatus) => {
    const statusOption = socialAssistanceStatusOptions.find(option => option.value === status);
    return statusOption?.label || status;
  };

  const getStatusColor = (status: SocialAssistanceStatus) => {
    const statusOption = socialAssistanceStatusOptions.find(option => option.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const getNextStatus = (status: SocialAssistanceStatus) => {
    switch (status) {
      case SocialAssistanceStatus.DISIAPKAN:
        return SocialAssistanceStatus.DISALURKAN;
      case SocialAssistanceStatus.DISALURKAN:
        return SocialAssistanceStatus.SELESAI;
      default:
        return null;
    }
  };

  const getNextStatusLabel = (status: SocialAssistanceStatus) => {
    const nextStatus = getNextStatus(status);
    if (!nextStatus) return null;
    
    const statusOption = socialAssistanceStatusOptions.find(option => option.value === nextStatus);
    return statusOption?.label || nextStatus;
  };

  const canManageProgram = () => {
    return isAdmin || isRW;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Program Bantuan Sosial</h1>
        
        {/* Only Admin and RW can create programs */}
        {(isAdmin || isRW) && (
          <Link href="/dashboard/bantuan/buat" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2" /> Buat Program Bantuan Baru
          </Link>
        )}
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
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Cari berdasarkan nama atau deskripsi..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <div className="relative">
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Semua Tipe</option>
                {socialAssistanceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <FiFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="relative">
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Semua Status</option>
                {socialAssistanceStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <FiFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="self-end">
            <button
              type="submit"
              className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Programs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : programs.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Tidak ada program bantuan yang ditemukan
          </div>
        ) : (
          programs.map((program) => (
            <div key={program.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(program.type)}`}>
                        {getTypeLabel(program.type)}
                      </span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                        {getStatusLabel(program.status)}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">{program.name}</h2>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center text-sm text-gray-500">
                    <FiCalendar className="mr-1" />
                    <span>{formatDate(program.startDate)}</span>
                    {program.endDate && (
                      <span> - {formatDate(program.endDate)}</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-600 line-clamp-2">{program.description}</p>
                </div>
                
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-gray-500">Sumber: {program.source}</span>
                  {program.recipientCount !== undefined && (
                    <span className="ml-4 flex items-center text-sm text-gray-500">
                      <FiUsers className="mr-1" />
                      {program.recipientCount} penerima
                    </span>
                  )}
                </div>
                
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href={`/dashboard/bantuan/${program.id}`} className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <FiEye className="mr-1" /> Detail
                  </Link>
                  
                  <Link href={`/dashboard/bantuan/${program.id}/penerima`} className="inline-flex items-center px-3 py-1.5 border border-purple-300 rounded-md text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100">
                    <FiUsers className="mr-1" /> Kelola Penerima
                  </Link>
                  
                  {/* Admin and RW can manage programs */}
                  {canManageProgram() && (
                    <>
                      <Link href={`/dashboard/bantuan/${program.id}/edit`} className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                        <FiEdit className="mr-1" /> Edit
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteProgram(program.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <FiTrash className="mr-1" /> Hapus
                      </button>
                      
                      {/* Update status button */}
                      {getNextStatus(program.status) && (
                        <button
                          onClick={() => handleUpdateStatus(program.id, getNextStatus(program.status)!)}
                          className="inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                        >
                          <FiCheck className="mr-1" /> Ubah ke {getNextStatusLabel(program.status)}
                        </button>
                      )}
                      
                      <button
                        onClick={() => socialAssistanceApi.exportRecipients(program.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FiDownload className="mr-1" /> Unduh Data Penerima
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 