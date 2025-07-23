'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { documentApi } from '@/lib/api';
import { DocumentType, documentTypeOptions } from '@/lib/types/document';
import { FiPlus, FiEdit, FiTrash, FiEye, FiDownload, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

interface Template {
  id: number;
  name: string;
  type: DocumentType;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentTemplatesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';

  useEffect(() => {
    if (!loading && user) {
      if (!isAdmin && !isRW) {
        // Redirect non-admin/RW users
        router.push('/dashboard');
        return;
      }
      
      fetchTemplates();
    }
  }, [user, loading, router]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      // This would be replaced with an actual API call when implemented
      // const response = await documentApi.getTemplates();
      // setTemplates(response.templates);
      
      // Placeholder data for UI development
      setTemplates([
        {
          id: 1,
          name: 'Template Surat Domisili',
          type: DocumentType.DOMISILI,
          content: '<p>Ini adalah template surat domisili</p>',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Template Surat Pengantar SKCK',
          type: DocumentType.PENGANTAR_SKCK,
          content: '<p>Ini adalah template surat pengantar SKCK</p>',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 3,
          name: 'Template Surat Keterangan Tidak Mampu',
          type: DocumentType.TIDAK_MAMPU,
          content: '<p>Ini adalah template surat keterangan tidak mampu</p>',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Gagal memuat template dokumen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      return;
    }
    
    try {
      // This would be replaced with an actual API call when implemented
      // await documentApi.deleteTemplate(id);
      
      // For now, just filter out the deleted template
      setTemplates(templates.filter(template => template.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Gagal menghapus template');
    }
  };

  const handlePreviewTemplate = (id: number) => {
    // Navigate to template preview page
    router.push(`/dashboard/surat/template/${id}/preview`);
  };

  const handleDownloadTemplate = async (id: number) => {
    try {
      // This would be replaced with an actual API call when implemented
      // await documentApi.downloadTemplate(id);
      alert('Template berhasil diunduh');
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Gagal mengunduh template');
    }
  };

  const getDocumentTypeName = (type: DocumentType) => {
    const typeOption = documentTypeOptions.find(option => option.value === type);
    return typeOption?.label || type;
  };

  if (!isAdmin && !isRW) {
    return null; // Prevent rendering for unauthorized users
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Template Dokumen</h1>
        <Link href="/dashboard/surat/template/buat" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <FiPlus className="mr-2" /> Buat Template Baru
        </Link>
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

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Template
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Dokumen
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terakhir Diperbarui
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada template dokumen
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {template.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDocumentTypeName(template.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.isDefault ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Ya
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Tidak
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.updatedAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handlePreviewTemplate(template.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Pratinjau"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        <Link
                          href={`/dashboard/surat/template/${template.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <FiEdit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDownloadTemplate(template.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Unduh"
                        >
                          <FiDownload className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus"
                          disabled={template.isDefault}
                          className={`${template.isDefault ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                        >
                          <FiTrash className="w-5 h-5" />
                        </button>
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