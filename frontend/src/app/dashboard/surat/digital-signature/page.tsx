'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { FiUpload, FiTrash, FiSave, FiAlertCircle, FiPlus } from 'react-icons/fi';
import SignatureCanvas from 'react-signature-canvas';

interface Signature {
  id: number;
  name: string;
  imageUrl: string;
  isDefault: boolean;
  createdAt: string;
}

export default function DigitalSignaturePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';

  useEffect(() => {
    if (!loading && user) {
      if (!isAdmin && !isRW) {
        // Redirect non-admin/RW users
        router.push('/dashboard');
        return;
      }
      
      fetchSignatures();
    }
  }, [user, loading, router]);

  const fetchSignatures = async () => {
    try {
      setIsLoading(true);
      // This would be replaced with an actual API call when implemented
      // const response = await documentApi.getSignatures();
      // setSignatures(response.signatures);
      
      // Placeholder data for UI development
      setSignatures([
        {
          id: 1,
          name: 'Tanda Tangan Ketua RW',
          imageUrl: 'https://via.placeholder.com/150x100?text=Signature',
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Tanda Tangan Sekretaris RW',
          imageUrl: 'https://via.placeholder.com/150x100?text=Signature2',
          isDefault: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error fetching signatures:', error);
      setError('Gagal memuat tanda tangan digital');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSignature = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tanda tangan ini?')) {
      return;
    }
    
    try {
      // This would be replaced with an actual API call when implemented
      // await documentApi.deleteSignature(id);
      
      // For now, just filter out the deleted signature
      setSignatures(signatures.filter(signature => signature.id !== id));
    } catch (error) {
      console.error('Error deleting signature:', error);
      setError('Gagal menghapus tanda tangan');
    }
  };

  const handleSetDefaultSignature = async (id: number) => {
    try {
      // This would be replaced with an actual API call when implemented
      // await documentApi.setDefaultSignature(id);
      
      // For now, update the state manually
      setSignatures(signatures.map(signature => ({
        ...signature,
        isDefault: signature.id === id,
      })));
    } catch (error) {
      console.error('Error setting default signature:', error);
      setError('Gagal mengatur tanda tangan default');
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError('Tanda tangan tidak boleh kosong');
      return;
    }
    
    if (!signatureName.trim()) {
      setError('Nama tanda tangan harus diisi');
      return;
    }
    
    try {
      const signatureImage = signatureRef.current.toDataURL('image/png');
      
      // This would be replaced with an actual API call when implemented
      // await documentApi.saveSignature({
      //   name: signatureName,
      //   imageData: signatureImage,
      //   isDefault,
      // });
      
      // For now, just add to the state
      const newSignature = {
        id: signatures.length + 1,
        name: signatureName,
        imageUrl: signatureImage,
        isDefault,
        createdAt: new Date().toISOString(),
      };
      
      if (isDefault) {
        setSignatures([
          ...signatures.map(sig => ({ ...sig, isDefault: false })),
          newSignature,
        ]);
      } else {
        setSignatures([...signatures, newSignature]);
      }
      
      // Reset form and close modal
      clearSignature();
      setShowSignatureModal(false);
    } catch (error) {
      console.error('Error saving signature:', error);
      setError('Gagal menyimpan tanda tangan');
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setSignatureName('');
    setIsDefault(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const img = new Image();
          img.onload = () => {
            if (signatureRef.current) {
              const canvas = signatureRef.current.getCanvas();
              const ctx = canvas.getContext('2d');
              
              // Clear canvas
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
              
              // Calculate dimensions to fit image while maintaining aspect ratio
              const scale = Math.min(
                canvas.width / img.width,
                canvas.height / img.height
              ) * 0.8;
              
              const x = (canvas.width - img.width * scale) / 2;
              const y = (canvas.height - img.height * scale) / 2;
              
              // Draw image
              ctx?.drawImage(
                img,
                x,
                y,
                img.width * scale,
                img.height * scale
              );
            }
          };
          img.src = event.target.result as string;
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  if (!isAdmin && !isRW) {
    return null; // Prevent rendering for unauthorized users
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Tanda Tangan Digital</h1>
        <button
          onClick={() => setShowSignatureModal(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FiPlus className="mr-2" /> Tambah Tanda Tangan
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

      {/* Signatures Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : signatures.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Belum ada tanda tangan digital yang tersimpan</p>
            <button
              onClick={() => setShowSignatureModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tambah Tanda Tangan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signatures.map((signature) => (
              <div key={signature.id} className="border rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{signature.name}</h3>
                    {signature.isDefault && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 flex justify-center">
                  <img
                    src={signature.imageUrl}
                    alt={signature.name}
                    className="max-h-32 object-contain"
                  />
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-between">
                  <div className="text-sm text-gray-500">
                    Dibuat: {new Date(signature.createdAt).toLocaleDateString('id-ID')}
                  </div>
                  <div className="flex space-x-2">
                    {!signature.isDefault && (
                      <button
                        onClick={() => handleSetDefaultSignature(signature.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Jadikan Default"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSignature(signature.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Hapus"
                    >
                      <FiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Tanda Tangan Digital</h3>
            
            <div className="mb-4">
              <label htmlFor="signatureName" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Tanda Tangan <span className="text-red-500">*</span>
              </label>
              <input
                id="signatureName"
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contoh: Tanda Tangan Ketua RW"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buat Tanda Tangan
              </label>
              <div className="border border-gray-300 rounded-md">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="black"
                  canvasProps={{
                    className: 'w-full h-48 bg-white',
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Hapus
                </button>
                <div>
                  <label
                    htmlFor="signatureUpload"
                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-800"
                  >
                    <FiUpload className="inline-block mr-1" /> Unggah Gambar
                  </label>
                  <input
                    id="signatureUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-4 flex items-center">
              <input
                id="isDefault"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                Jadikan sebagai tanda tangan default
              </label>
            </div>
            
            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  clearSignature();
                  setShowSignatureModal(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSignature}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 