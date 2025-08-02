'use client';

export const dynamic = 'force-dynamic';

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
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit, 
  FiTrash, 
  FiEye, 
  FiMessageCircle,
  FiCheck,
  FiX
} from 'react-icons/fi';
import Link from 'next/link';

export default function ComplaintsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
  });

  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';
  const isWarga = user?.role === 'WARGA';

  useEffect(() => {
    if (!loading && user) {
      fetchComplaints();
    }
  }, [user, loading]);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const params: any = { ...filters };
      
      // For RT, only show complaints from their RT
      if (isRT && user?.resident?.rtNumber) {
        params.rtNumber = user.resident.rtNumber;
      }
      
      // For Warga, only show their own complaints
      if (isWarga) {
        // The backend will filter by the authenticated user
      }
      
      const response = await complaintApi.getAllComplaints(params);
      setComplaints(response.complaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Gagal memuat data pengaduan');
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
    fetchComplaints();
  };

  const handleDeleteComplaint = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengaduan ini?')) {
      return;
    }
    
    try {
      await complaintApi.deleteComplaint(id);
      fetchComplaints();
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

  const isComplaintCreator = (complaint: Complaint) => {
    return complaint.createdBy === user?.id;
  };

  const canManageComplaint = (complaint: Complaint) => {
    if (isAdmin || isRW) return true;
    if (isRT && user?.resident?.rtNumber) {
      // RT can manage complaints from their RT
      // This is a simplified check - the backend will do proper validation
      return true;
    }
    return isComplaintCreator(complaint) && complaint.status === ComplaintStatus.DITERIMA;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Pengaduan & Aspirasi Warga</h1>
        
        {/* Only non-RW users can create complaints */}
        {!isRW && (
          <Link href="/dashboard/pengaduan/buat" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2" /> Buat Pengaduan Baru
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
                placeholder="Cari berdasarkan judul atau deskripsi..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Semua Kategori</option>
                {complaintCategoryOptions.map((option) => (
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
                {complaintStatusOptions.map((option) => (
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

      {/* Complaints List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Tidak ada pengaduan yang ditemukan
          </div>
        ) : (
          complaints.map((complaint) => (
            <div key={complaint.id} className="bg-white rounded-lg shadow overflow-hidden">
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
                
                {complaint.location && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <FiMapPin className="mr-1" />
                    <span>{complaint.location}</span>
                  </div>
                )}
                
                <div className="mt-4">
                  <p className="text-gray-600 line-clamp-2">{complaint.description}</p>
                </div>
                
                {complaint.response && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center mb-2">
                      <FiMessageCircle className="mr-2 text-blue-500" />
                      <span className="font-medium text-gray-700">Tanggapan:</span>
                      {complaint.respondedAt && (
                        <span className="ml-2 text-xs text-gray-500">
                          {formatDate(complaint.respondedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 line-clamp-2">{complaint.response}</p>
                  </div>
                )}
                
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href={`/dashboard/pengaduan/${complaint.id}`} className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <FiEye className="mr-1" /> Detail
                  </Link>
                  
                  {/* Admin, RW, RT can respond to complaints */}
                  {(isAdmin || isRW || isRT) && complaint.status !== ComplaintStatus.SELESAI && (
                    <Link href={`/dashboard/pengaduan/${complaint.id}/tanggapi`} className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                      <FiMessageCircle className="mr-1" /> Tanggapi
                    </Link>
                  )}
                  
                  {/* Only show edit for complaint creators and only if status is DITERIMA */}
                  {canManageComplaint(complaint) && (
                    <>
                      <Link href={`/dashboard/pengaduan/${complaint.id}/edit`} className="inline-flex items-center px-3 py-1.5 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100">
                        <FiEdit className="mr-1" /> Edit
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteComplaint(complaint.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <FiTrash className="mr-1" /> Hapus
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