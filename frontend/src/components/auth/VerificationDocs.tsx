
'use client';

import React, { useState, useEffect } from 'react';
import { authApi, residentApi } from '@/lib/api';
import { toast } from 'react-toastify';
import { FiEye, FiDownload } from 'react-icons/fi';

interface DisplayDocument {
  type: 'KTP' | 'KK';
  filename: string;
  url: string;
  uploadedAt: string;
}

const VerificationDocs = () => {
  const [documents, setDocuments] = useState<DisplayDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // First get current user profile to get resident ID
        const userProfile = await authApi.getProfile();
        
        if (!userProfile.resident?.id) {
          // User doesn't have associated resident record
          setDocuments([]);
          setIsLoading(false);
          return;
        }
        
        // Then get resident documents
        const residentDocuments = await residentApi.getResidentDocuments(userProfile.resident.id);
        
        const docs: DisplayDocument[] = [];
        
        residentDocuments.forEach(doc => {
          // Check if document has been uploaded (has fileUrl and uploadedAt)
          if (doc.fileUrl && doc.uploadedAt && doc.status !== 'not_uploaded') {
            docs.push({
              type: doc.type as 'KTP' | 'KK',
              filename: doc.filename,
              url: doc.fileUrl,
              uploadedAt: new Date(doc.uploadedAt).toLocaleDateString('id-ID'),
            });
          }
        });
        
        setDocuments(docs);
      } catch (error) {
        console.error('Failed to fetch verification documents:', error);
        // Don't show error toast for now as this might be expected for new users
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handlePreview = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Memuat dokumen...</p>
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-500">
            Anda belum mengunggah dokumen verifikasi KTP dan KK.
            </p>
        </div>
    );
  }

  return (
    <div className="mt-6">
        <h4 className="text-md font-semibold mb-3">Dokumen Terunggah</h4>
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Dokumen</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama File</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Upload</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {documents.map((doc) => (
                    <tr key={doc.type}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{doc.type}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">{doc.filename}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{doc.uploadedAt}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => handlePreview(doc.url)} className="text-blue-600 hover:text-blue-800 mr-3 transition-colors">
                                <FiEye aria-label="Lihat" />
                            </button>
                            <button onClick={() => handleDownload(doc.url, doc.filename)} className="text-green-600 hover:text-green-800 transition-colors">
                                <FiDownload aria-label="Unduh" />
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default VerificationDocs;

