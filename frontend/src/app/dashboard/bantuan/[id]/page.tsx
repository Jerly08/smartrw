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
  FiEdit, 
  FiTrash, 
  FiArrowLeft, 
  FiCheck,
  FiX,
  FiDownload,
  FiInfo
} from 'react-icons/fi';
import Link from 'next/link';

export default function SocialAssistanceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [program, setProgram] = useState<SocialAssistance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const programId = parseInt(params.id);
  
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
      
      fetchProgram();
    }
  }, [programId, user, loading, router]);

  const fetchProgram = async () => {
    try {
      setIsLoading(true);
      const data = await socialAssistanceApi.getSocialAssistanceById(programId);
      setProgram(data);
    } catch (error) {
      console.error('Error fetching social assistance program:', error);
      setError('Gagal memuat data program bantuan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus program bantuan ini?')) {
      return;
    }
    
    try {
      await socialAssistanceApi.deleteSocialAssistance(programId);
      router.push('/dashboard/bantuan');
    } catch (error) {
      console.error('Error deleting social assistance program:', error);
      setError('Gagal menghapus program bantuan');
    }
  };

  const handleUpdateStatus = async (status: SocialAssistanceStatus) => {
    try {
      await socialAssistanceApi.updateSocialAssistanceStatus(programId, status);
      fetchProgram();
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiX className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error || 'Program bantuan tidak ditemukan'}</p>
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
        <h1 className="text-2xl font-bold text-gray-800">Detail Program Bantuan</h1>
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

      {/* Program Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
            <span className="text-sm text-gray-500">Sumber: {program.source}</span>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Deskripsi</h3>
            <div className="prose max-w-none">
              <p className="text-gray-600 whitespace-pre-wrap">{program.description}</p>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Statistik Penerima</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Penerima</p>
                      <p className="text-2xl font-bold text-blue-600">{program.recipientCount || 0}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FiUsers className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Terverifikasi</p>
                      <p className="text-2xl font-bold text-green-600">
                        {program.recipients?.filter(r => r.isVerified).length || 0}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <FiCheck className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Telah Menerima</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {program.recipients?.filter(r => r.receivedDate).length || 0}
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <FiPackage className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/dashboard/bantuan/${program.id}/penerima`} className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100">
              <FiUsers className="mr-2" /> Kelola Penerima
            </Link>
            
            {/* Admin and RW can manage programs */}
            {canManageProgram() && (
              <>
                <Link href={`/dashboard/bantuan/${program.id}/edit`} className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                  <FiEdit className="mr-2" /> Edit
                </Link>
                
                <button
                  onClick={handleDeleteProgram}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                >
                  <FiTrash className="mr-2" /> Hapus
                </button>
                
                {/* Update status button */}
                {getNextStatus(program.status) && (
                  <button
                    onClick={() => handleUpdateStatus(getNextStatus(program.status)!)}
                    className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                  >
                    <FiCheck className="mr-2" /> Ubah ke {getNextStatusLabel(program.status)}
                  </button>
                )}
                
                <button
                  onClick={() => socialAssistanceApi.exportRecipients(program.id)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FiDownload className="mr-2" /> Unduh Data Penerima
                </button>
              </>
            )}
            
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiArrowLeft className="mr-2" /> Kembali
            </button>
          </div>
          
          {/* Status Information */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <FiInfo className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Status Program</h4>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Disiapkan:</strong> Program bantuan sedang dipersiapkan, penerima dapat ditambahkan.</li>
                  <li><strong>Disalurkan:</strong> Program bantuan sedang dalam proses penyaluran.</li>
                  <li><strong>Selesai:</strong> Program bantuan telah selesai disalurkan.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 