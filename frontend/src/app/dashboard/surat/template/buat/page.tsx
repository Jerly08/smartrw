'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { FiAlertCircle, FiUpload, FiFile, FiTrash2 } from 'react-icons/fi';

export default function CreateTemplatePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';

  useEffect(() => {
    if (!loading && user) {
      if (!isAdmin && !isRW) {
        // Redirect non-admin/RW users
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, isAdmin, isRW]);

  // File upload handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain', // .txt
      'text/html', // .html
      'application/rtf' // .rtf
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan .docx, .doc, .txt, .html, atau .rtf');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);
    setError(null);

    try {
      // Process the file based on type
      if (file.type === 'text/plain' || file.type === 'text/html') {
        const text = await file.text();
        setFilePreview(text);
      } else {
        // For Word documents, we'd need a library like mammoth.js
        // For now, show file info
        setFilePreview(`File: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)} KB\nType: ${file.type}`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Gagal memproses file. Silakan coba lagi.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFilePreview('');
    setError(null);
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUseFileContent = () => {
    if (filePreview) {
      // This would set the content in the form
      // For now, we'll just show an alert
      alert('Konten file akan digunakan sebagai template. Fitur ini akan diimplementasikan dengan integrasi API.');
    }
  };

  if (!isAdmin && !isRW) {
    return null; // Prevent rendering for unauthorized users
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Upload Template Dokumen</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Kembali
        </button>
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
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload File Template</h3>
            <p className="text-sm text-gray-600 mb-6">
              Upload file dokumen yang akan dijadikan template surat. File yang didukung: .docx, .doc, .txt, .html, .rtf (Maksimal 10MB)
            </p>
          </div>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Klik untuk upload file atau drag & drop
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    DOC, DOCX, TXT, HTML, RTF sampai 10MB
                  </span>
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".doc,.docx,.txt,.html,.rtf"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </div>

          {/* File Processing Indicator */}
          {isProcessingFile && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">Memproses file...</span>
            </div>
          )}

          {/* Uploaded File Info */}
          {uploadedFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiFile className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.size / 1024).toFixed(2)} KB • {uploadedFile.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-800"
                  title="Hapus file"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* File Preview */}
          {filePreview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview Konten File
              </label>
              <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap">{filePreview}</pre>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleUseFileContent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Gunakan Konten Ini sebagai Template
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 