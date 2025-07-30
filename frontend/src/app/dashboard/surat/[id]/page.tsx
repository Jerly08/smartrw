'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { documentApi } from '@/lib/api';
import { Document, DocumentStatus, documentStatusOptions, documentTypeOptions } from '@/lib/types/document';
import { FiArrowLeft, FiDownload, FiCheck, FiX, FiEdit, FiClock, FiUser, FiCalendar } from 'react-icons/fi';

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const documentId = parseInt(params.id);
  
  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';
  const isWarga = user?.role === 'WARGA';

  useEffect(() => {
    if (!loading && user) {
      fetchDocument();
    }
  }, [documentId, user, loading]);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const doc = await documentApi.getDocumentById(documentId);
      setDocument(doc);
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Gagal memuat data dokumen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (status: DocumentStatus) => {
    try {
      if (status === DocumentStatus.DISETUJUI) {
        await documentApi.approveDocument(documentId);
      } else if (status === DocumentStatus.DITANDATANGANI) {
        await documentApi.signDocument(documentId);
      } else if (status === DocumentStatus.SELESAI) {
        await documentApi.completeDocument(documentId);
      } else if (status === DocumentStatus.DIPROSES) {
        await documentApi.updateDocumentStatus(documentId, { status });
      }
      fetchDocument();
    } catch (error) {
      console.error('Error updating document status:', error);
      setError('Gagal memperbarui status dokumen');
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectionReason.trim()) {
      setError('Alasan penolakan harus diisi');
      return;
    }
    
    try {
      await documentApi.rejectDocument(documentId, rejectionReason);
      setShowRejectionModal(false);
      fetchDocument();
    } catch (error) {
      console.error('Error rejecting document:', error);
      setError('Gagal menolak dokumen');
    }
  };

  const handleDownloadDocument = async () => {
    try {
      await documentApi.downloadDocument(documentId);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Gagal mengunduh dokumen');
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const statusOption = documentStatusOptions.find(option => option.value === status);
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusOption?.color}`}>
        {statusOption?.label}
      </span>
    );
  };

  const getDocumentTypeName = (type: string) => {
    const typeOption = documentTypeOptions.find(option => option.value === type);
    return typeOption?.label || type;
  };

  // Check if user has permission to view this document
  const canViewDocument = () => {
    if (!document || !user) return false;
    
    // Admin and RW can view all documents
    if (isAdmin || isRW) return true;
    
    // RT can view documents from their RT
    if (isRT && user.resident?.rtNumber && document.requester?.resident?.rtNumber) {
      return user.resident.rtNumber === document.requester.resident.rtNumber;
    }
    
    // Warga can only view their own documents
    if (isWarga && document.requesterId === user.id) return true;
    
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiX className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error || 'Dokumen tidak ditemukan'}</p>
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

  if (!canViewDocument()) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiX className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">Anda tidak memiliki akses untuk melihat dokumen ini</p>
            <button
              onClick={() => router.back()}
              className="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-600"
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
        <h1 className="text-2xl font-bold text-gray-800">Detail Surat</h1>
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

      {/* Document Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{document.subject}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {getDocumentTypeName(document.type)}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              {getStatusBadge(document.status)}
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <FiUser className="mr-2" /> Pemohon
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {document.requester?.resident?.fullName || document.requester?.name || '-'}
                </dd>
              </div>
              
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <FiClock className="mr-2" /> Status
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {getStatusBadge(document.status)}
                </dd>
              </div>
              
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <FiCalendar className="mr-2" /> Tanggal Pengajuan
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(document.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              
              {document.status === DocumentStatus.DITOLAK && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Alasan Penolakan</dt>
                  <dd className="mt-1 text-sm text-red-600">
                    {document.rejectionReason || '-'}
                  </dd>
                </div>
              )}
              
              {document.approvedBy && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Disetujui Oleh</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.approvedBy} ({document.approvedAt ? new Date(document.approvedAt).toLocaleDateString('id-ID') : '-'})
                  </dd>
                </div>
              )}
              
              {document.signedBy && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ditandatangani Oleh</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.signedBy} ({document.signedAt ? new Date(document.signedAt).toLocaleDateString('id-ID') : '-'})
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Deskripsi</h3>
          <div className="mt-4 prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{document.description}</p>
          </div>
        </div>
      </div>

      {/* Document Attachments */}
      {document.attachments && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Lampiran</h3>
            <div className="mt-4">
              <ul className="divide-y divide-gray-200">
                {JSON.parse(document.attachments).map((attachment: string, index: number) => {
                  const filename = attachment.split('/').pop() || '';
                  return (
                    <li key={index} className="py-3 flex justify-between">
                      <span className="text-sm">{filename}</span>
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        onClick={async () => {
                          try {
                            await documentApi.downloadAttachment(documentId, filename);
                          } catch (error) {
                            console.error('Error downloading attachment:', error);
                            setError('Gagal mengunduh lampiran. Silakan coba lagi.');
                          }
                        }}
                      >
                        <FiDownload className="mr-1" /> Unduh
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Aksi</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {/* Admin and RW can process documents */}
            {(isAdmin || isRW) && document.status === DocumentStatus.DIAJUKAN && (
              <button
                onClick={() => handleStatusUpdate(DocumentStatus.DIPROSES)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiEdit className="mr-2" /> Proses Surat
              </button>
            )}
            
            {/* RT can recommend documents */}
            {isRT && document.status === DocumentStatus.DIAJUKAN && (
              <button
                onClick={() => handleStatusUpdate(DocumentStatus.DIPROSES)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiEdit className="mr-2" /> Rekomendasikan
              </button>
            )}
            
            {/* Admin and RW can approve documents */}
            {(isAdmin || isRW) && document.status === DocumentStatus.DIPROSES && (
              <button
                onClick={() => handleStatusUpdate(DocumentStatus.DISETUJUI)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <FiCheck className="mr-2" /> Setujui
              </button>
            )}
            
            {/* Admin and RW can sign documents */}
            {(isAdmin || isRW) && document.status === DocumentStatus.DISETUJUI && (
              <button
                onClick={() => handleStatusUpdate(DocumentStatus.DITANDATANGANI)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                <FiEdit className="mr-2" /> Tandatangani
              </button>
            )}
            
            {/* Admin and RW can complete documents */}
            {(isAdmin || isRW) && document.status === DocumentStatus.DITANDATANGANI && (
              <button
                onClick={() => handleStatusUpdate(DocumentStatus.SELESAI)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <FiCheck className="mr-2" /> Selesaikan
              </button>
            )}
            
            {/* Admin, RW, and RT can reject documents */}
            {(isAdmin || isRW || isRT) && 
              (document.status === DocumentStatus.DIAJUKAN || document.status === DocumentStatus.DIPROSES) && (
              <button
                onClick={() => setShowRejectionModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <FiX className="mr-2" /> Tolak
              </button>
            )}
            
            {/* Download completed documents */}
            {document.status === DocumentStatus.SELESAI && (
              <button
                onClick={handleDownloadDocument}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
              >
                <FiDownload className="mr-2" /> Unduh Surat
              </button>
            )}
            
            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiArrowLeft className="mr-2" /> Kembali
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900">Tolak Pengajuan Surat</h3>
            <div className="mt-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectionReason"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Berikan alasan penolakan..."
              />
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRejectDocument}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 