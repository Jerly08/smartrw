'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { documentApi } from '@/lib/api';
import { Document, DocumentStatus, DocumentType, documentStatusOptions, documentTypeOptions } from '@/lib/types/document';
import { FiFileText, FiPlus, FiSearch, FiFilter, FiDownload, FiCheck, FiX, FiEdit } from 'react-icons/fi';
import Link from 'next/link';

export default function DocumentManagementPage() {
  const { user, loading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      fetchDocuments();
      fetchStatistics();
    }
  }, [user, loading]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const params: any = { ...filters };
      
      // For RT, only show documents from their RT
      if (isRT && user?.resident?.rtNumber) {
        params.rtNumber = user.resident.rtNumber;
      }
      
      // For Warga, only show their own documents
      if (isWarga) {
        params.requesterId = user.id;
      }
      
      const response = await documentApi.getAllDocuments(params);
      setDocuments(response.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      if (isAdmin || isRW || isRT) {
        const stats = await documentApi.getDocumentStatistics();
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error fetching document statistics:', error);
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
    fetchDocuments();
  };

  const handleStatusUpdate = async (id: number, status: DocumentStatus) => {
    try {
      if (status === DocumentStatus.DISETUJUI) {
        await documentApi.approveDocument(id);
      } else if (status === DocumentStatus.DITANDATANGANI) {
        await documentApi.signDocument(id);
      } else if (status === DocumentStatus.SELESAI) {
        await documentApi.completeDocument(id);
      } else if (status === DocumentStatus.DIPROSES) {
        await documentApi.updateDocumentStatus(id, { status });
      }
      fetchDocuments();
      fetchStatistics();
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  const handleRejectDocument = async (id: number) => {
    const reason = prompt('Alasan penolakan:');
    if (reason) {
      try {
        await documentApi.rejectDocument(id, reason);
        fetchDocuments();
        fetchStatistics();
      } catch (error) {
        console.error('Error rejecting document:', error);
      }
    }
  };

  const handleDownloadDocument = async (id: number) => {
    try {
      await documentApi.downloadDocument(id);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const statusOption = documentStatusOptions.find(option => option.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusOption?.color}`}>
        {statusOption?.label}
      </span>
    );
  };

  const getDocumentTypeName = (type: DocumentType) => {
    const typeOption = documentTypeOptions.find(option => option.value === type);
    return typeOption?.label || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Administrasi Surat</h1>
        
        {/* Only show create button for Warga */}
        {isWarga && (
          <Link href="/dashboard/surat/buat" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2" /> Ajukan Surat
          </Link>
        )}
      </div>

      {/* Statistics for Admin, RW, and RT */}
      {(isAdmin || isRW || isRT) && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Surat</div>
            <div className="text-2xl font-bold">{statistics.total || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Menunggu Persetujuan</div>
            <div className="text-2xl font-bold">{statistics.pending || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Dalam Proses</div>
            <div className="text-2xl font-bold">{(statistics.diproses || 0) + (statistics.disetujui || 0) + (statistics.ditandatangani || 0)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Selesai</div>
            <div className="text-2xl font-bold">{statistics.completed || 0}</div>
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
                placeholder="Cari berdasarkan subjek atau deskripsi..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Jenis Surat</label>
            <div className="relative">
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Semua</option>
                {documentTypeOptions.map((option) => (
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
                <option value="">Semua</option>
                {documentStatusOptions.map((option) => (
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

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Surat
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subjek
                </th>
                {(isAdmin || isRW || isRT) && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pemohon
                  </th>
                )}
                {(isAdmin || isRW || isRT) && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RT/RW
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada data surat
                  </td>
                </tr>
              ) : (
                documents.map((document, index) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDocumentTypeName(document.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link href={`/dashboard/surat/${document.id}`} className="hover:text-blue-600">
                        {document.subject}
                      </Link>
                    </td>
                    {(isAdmin || isRW || isRT) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.requester?.resident?.fullName || document.requester?.name || '-'}
                      </td>
                    )}
                    {(isAdmin || isRW || isRT) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.requester?.resident ? 
                          `RT ${document.requester.resident.rtNumber}/RW ${document.requester.resident.rwNumber}` : 
                          '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(document.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(document.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link href={`/dashboard/surat/${document.id}`} className="text-blue-600 hover:text-blue-900">
                          <FiFileText className="w-5 h-5" title="Lihat Detail" />
                        </Link>
                        
                        {/* Admin and RW can approve documents */}
                        {(isAdmin || isRW) && document.status === DocumentStatus.DIAJUKAN && (
                          <button 
                            onClick={() => handleStatusUpdate(document.id, DocumentStatus.DIPROSES)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Proses Surat"
                          >
                            <FiEdit className="w-5 h-5" />
                          </button>
                        )}
                        
                        {/* Admin and RW can approve documents */}
                        {(isAdmin || isRW) && document.status === DocumentStatus.DIPROSES && (
                          <button 
                            onClick={() => handleStatusUpdate(document.id, DocumentStatus.DISETUJUI)}
                            className="text-green-600 hover:text-green-900"
                            title="Setujui"
                          >
                            <FiCheck className="w-5 h-5" />
                          </button>
                        )}
                        
                        {/* RT can recommend documents */}
                        {isRT && document.status === DocumentStatus.DIAJUKAN && (
                          <button 
                            onClick={() => handleStatusUpdate(document.id, DocumentStatus.DIPROSES)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Rekomendasikan"
                          >
                            <FiEdit className="w-5 h-5" />
                          </button>
                        )}
                        
                        {/* Admin and RW can sign documents */}
                        {(isAdmin || isRW) && document.status === DocumentStatus.DISETUJUI && (
                          <button 
                            onClick={() => handleStatusUpdate(document.id, DocumentStatus.DITANDATANGANI)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Tandatangani"
                          >
                            <FiEdit className="w-5 h-5" />
                          </button>
                        )}
                        
                        {/* Admin and RW can complete documents */}
                        {(isAdmin || isRW) && document.status === DocumentStatus.DITANDATANGANI && (
                          <button 
                            onClick={() => handleStatusUpdate(document.id, DocumentStatus.SELESAI)}
                            className="text-green-600 hover:text-green-900"
                            title="Selesaikan"
                          >
                            <FiCheck className="w-5 h-5" />
                          </button>
                        )}
                        
                        {/* Admin, RW, and RT can reject documents */}
                        {(isAdmin || isRW || isRT) && 
                          (document.status === DocumentStatus.DIAJUKAN || document.status === DocumentStatus.DIPROSES) && (
                          <button 
                            onClick={() => handleRejectDocument(document.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Tolak"
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                        )}
                        
                        {/* Download completed documents */}
                        {document.status === DocumentStatus.SELESAI && (
                          <button 
                            onClick={() => handleDownloadDocument(document.id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Unduh"
                          >
                            <FiDownload className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 