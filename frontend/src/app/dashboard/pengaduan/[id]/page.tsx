'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { complaintApi } from '@/lib/api';
import { 
  Complaint, 
  ComplaintCategory, 
  ComplaintStatus, 
  complaintCategoryOptions, 
  complaintStatusOptions 
} from '@/lib/types/complaint';
import { 
  FiMessageSquare, 
  FiMapPin, 
  FiClock, 
  FiEdit, 
  FiTrash, 
  FiArrowLeft, 
  FiMessageCircle,
  FiPaperclip,
  FiUser,
  FiX,
  FiDownload
} from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const complaintId = parseInt(params.id);
  
  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';
  const isWarga = user?.role === 'WARGA';

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
    } catch (error) {
      console.error('Error fetching complaint:', error);
      setError('Gagal memuat data pengaduan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengaduan ini?')) {
      return;
    }
    
    try {
      await complaintApi.deleteComplaint(complaintId);
      router.push('/dashboard/pengaduan');
    } catch (error) {
      console.error('Error deleting complaint:', error);
      setError('Gagal menghapus pengaduan');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryName = (category: ComplaintCategory) => {
    const categoryOption = complaintCategoryOptions.find(option => option.value === category);
    return categoryOption?.label || category;
  };

  const getCategoryColor = (category: ComplaintCategory) => {
    const categoryOption = complaintCategoryOptions.find(option => option.value === category);
    return categoryOption?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusName = (status: ComplaintStatus) => {
    const statusOption = complaintStatusOptions.find(option => option.value === status);
    return statusOption?.label || status;
  };

  const getStatusColor = (status: ComplaintStatus) => {
    const statusOption = complaintStatusOptions.find(option => option.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const isComplaintCreator = () => {
    return complaint?.createdBy === user?.id;
  };

  const canManageComplaint = () => {
    if (!complaint) return false;
    if (isAdmin || isRW) return true;
    if (isRT) {
      // RT can manage complaints from their RT
      // This is a simplified check - the backend will do proper validation
      return true;
    }
    return isComplaintCreator() && complaint.status === ComplaintStatus.DITERIMA;
  };

  // Handle attachment download
  const handleAttachmentDownload = async (attachmentUrl: string) => {
    try {
      // Extract filename from URL - decode it to get the original filename
      const encodedFilename = attachmentUrl.split('/').pop() || 'attachment';
      const filename = decodeURIComponent(encodedFilename);
      
      // Create a link to download the file
      const link = document.createElement('a');
      link.href = attachmentUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading attachment:', error);
      setError('Gagal mengunduh lampiran. Silakan coba lagi.');
    }
  };

  // Handle attachment view
  const handleAttachmentView = (attachmentUrl: string) => {
    // The URL should already be in the correct format for the API
    window.open(attachmentUrl, '_blank');
  };

  const renderAttachments = () => {
    if (!complaint?.attachments) return null;
    
    try {
      const attachmentsList = JSON.parse(complaint.attachments);
      
      if (!Array.isArray(attachmentsList) || attachmentsList.length === 0) {
        return null;
      }
      
      return (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Lampiran</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {attachmentsList.map((attachment, index) => {
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);
              
              // Extract path components
              const pathParts = attachment.split('/');
              
              // Remove empty parts
              const cleanPathParts = pathParts.filter(part => part !== '');
              
              // Get the directory and filename
              // The path from the backend is typically /uploads/complaints/filename
              // We need to remove 'uploads' from the path for our API route
              let apiPathParts = [...cleanPathParts];
              if (apiPathParts[0] === 'uploads') {
                apiPathParts.shift(); // Remove 'uploads'
              }
              
              // Get the filename (last part)
              const filename = apiPathParts.length > 0 ? apiPathParts[apiPathParts.length - 1] : '';
              
              // Construct the API path
              const encodedFilename = encodeURIComponent(filename);
              const directoryPath = apiPathParts.length > 1 ? apiPathParts.slice(0, -1).join('/') + '/' : '';
              const apiPath = `/api/uploads/${directoryPath}${encodedFilename}`;
              
              return isImage ? (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={apiPath}
                    alt={`Lampiran ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity">
                    <button 
                      onClick={() => handleAttachmentView(apiPath)}
                      className="text-white opacity-0 hover:opacity-100 p-2"
                    >
                      <span className="text-white">Lihat</span>
                    </button>
                    <button
                      onClick={() => handleAttachmentDownload(apiPath)}
                      className="text-white opacity-0 hover:opacity-100 p-2"
                    >
                      <span className="text-white">Unduh</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div key={index} className="flex flex-col">
                  <button
                    onClick={() => handleAttachmentView(apiPath)}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 mb-2"
                  >
                    <FiPaperclip className="mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600 truncate">Lampiran {index + 1}</span>
                  </button>
                  <button
                    onClick={() => handleAttachmentDownload(apiPath)}
                    className="flex items-center justify-center p-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <FiDownload className="mr-1" /> Unduh
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error parsing attachments:', error);
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiX className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error || 'Pengaduan tidak ditemukan'}</p>
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
        <h1 className="text-2xl font-bold text-gray-800">Detail Pengaduan</h1>
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

      {/* Complaint Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(complaint.category)}`}>
                  {getCategoryName(complaint.category)}
                </span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                  {getStatusName(complaint.status)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{complaint.title}</h2>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-gray-500">
              {formatDate(complaint.createdAt)}
            </div>
          </div>

          <div className="mt-4 flex items-center text-sm text-gray-500">
            <FiUser className="mr-1" />
            <span>Oleh: {complaint.creator?.name || 'Pengguna'}</span>
          </div>
          
          {complaint.location && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <FiMapPin className="mr-1" />
              <span>{complaint.location}</span>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Deskripsi</h3>
            <div className="prose max-w-none">
              <p className="text-gray-600 whitespace-pre-wrap">{complaint.description}</p>
            </div>
          </div>
          
          {/* Attachments */}
          {renderAttachments()}
          
          {/* Response */}
          {complaint.response && (
            <div className="mt-8 bg-gray-50 p-5 rounded-lg">
              <div className="flex items-center mb-3">
                <FiMessageCircle className="mr-2 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900">Tanggapan</h3>
              </div>
              
              <div className="mb-2 flex items-center text-sm text-gray-500">
                {complaint.respondedBy && (
                  <span className="mr-3">Oleh: {complaint.respondedBy}</span>
                )}
                {complaint.respondedAt && (
                  <span>{formatDate(complaint.respondedAt)}</span>
                )}
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-600 whitespace-pre-wrap">{complaint.response}</p>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            {/* Admin, RW, RT can respond to complaints */}
            {(isAdmin || isRW || isRT) && complaint.status !== ComplaintStatus.SELESAI && (
              <Link 
                href={`/dashboard/pengaduan/${complaint.id}/tanggapi`} 
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <FiMessageCircle className="mr-2" /> Tanggapi
              </Link>
            )}
            
            {/* Only show edit for complaint creators and only if status is DITERIMA */}
            {canManageComplaint() && (
              <>
                <Link 
                  href={`/dashboard/pengaduan/${complaint.id}/edit`} 
                  className="inline-flex items-center px-4 py-2 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                  <FiEdit className="mr-2" /> Edit
                </Link>
                
                <button
                  onClick={handleDeleteComplaint}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                >
                  <FiTrash className="mr-2" /> Hapus
                </button>
              </>
            )}
            
            <button
              onClick={() => router.push('/dashboard/pengaduan')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiArrowLeft className="mr-2" /> Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 