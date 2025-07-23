'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { socialAssistanceApi } from '@/lib/api';
import { SocialAssistance, SocialAssistanceRecipient, socialAssistanceTypeOptions } from '@/lib/types/socialAssistance';
import { 
  FiPackage, 
  FiCheck, 
  FiX, 
  FiAlertCircle, 
  FiInfo,
  FiArrowLeft,
  FiCalendar
} from 'react-icons/fi';
import Link from 'next/link';

interface EligibilityResult {
  eligible: boolean;
  programs: SocialAssistance[];
  message: string;
}

interface AssistanceHistory {
  past: SocialAssistanceRecipient[];
  current: SocialAssistanceRecipient[];
}

export default function EligibilityCheckPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [history, setHistory] = useState<AssistanceHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isWarga = user?.role === 'WARGA';

  useEffect(() => {
    if (!loading && user) {
      // Only residents can access this page
      if (!isWarga) {
        router.push('/dashboard');
        return;
      }
      
      if (user.resident?.id) {
        checkEligibility(user.resident.id);
        fetchAssistanceHistory(user.resident.id);
      } else {
        setError('Data warga tidak ditemukan. Silakan lengkapi profil Anda terlebih dahulu.');
        setIsLoading(false);
      }
    }
  }, [user, loading, router]);

  const checkEligibility = async (residentId: number) => {
    try {
      const response = await socialAssistanceApi.checkEligibility(residentId);
      setEligibility(response);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setError('Gagal memeriksa kelayakan bantuan sosial');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssistanceHistory = async (residentId: number) => {
    try {
      const response = await socialAssistanceApi.getResidentAssistanceHistory(residentId);
      
      // Initialize with empty arrays if response is incomplete
      const formattedHistory: AssistanceHistory = {
        current: [],
        past: []
      };
      
      // If we have assistance history data, categorize it
      if (response && Array.isArray(response)) {
        // Categorize assistance into current and past
        const currentDate = new Date();
        
        response.forEach(item => {
          // Check if the program has an end date and if it's in the past
          const isPast = item.socialAssistance?.endDate && new Date(item.socialAssistance.endDate) < currentDate;
          
          if (isPast) {
            formattedHistory.past.push(item);
          } else {
            formattedHistory.current.push(item);
          }
        });
      }
      
      setHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching assistance history:', error);
      // Initialize with empty arrays on error
      setHistory({ current: [], past: [] });
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

  const getTypeLabel = (type: string) => {
    const typeOption = socialAssistanceTypeOptions.find(option => option.value === type);
    return typeOption?.label || type;
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isWarga) {
    return null; // Don't render anything if not a resident
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
        <h1 className="text-2xl font-bold text-gray-800">Cek Kelayakan Bantuan Sosial</h1>
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

      {/* Eligibility Results */}
      {eligibility && (
        <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
          eligibility.eligible ? 'border-green-500' : 'border-yellow-500'
        }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 p-2 rounded-full ${
              eligibility.eligible ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {eligibility.eligible ? (
                <FiCheck className={`h-6 w-6 ${
                  eligibility.eligible ? 'text-green-600' : 'text-yellow-600'
                }`} />
              ) : (
                <FiInfo className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">
                {eligibility.eligible ? 'Anda memenuhi syarat untuk program bantuan' : 'Status Kelayakan'}
              </h2>
              <p className="mt-2 text-gray-600">{eligibility.message}</p>
            </div>
          </div>

          {eligibility.eligible && eligibility.programs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Program yang Tersedia:</h3>
              <div className="space-y-3">
                {eligibility.programs.map((program) => (
                  <div key={program.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{program.name}</h4>
                        <p className="text-sm text-gray-500">{getTypeLabel(program.type)}</p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FiCalendar className="mr-1" />
                        <span>{formatDate(program.startDate)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{program.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assistance History */}
      {history && (
        <div className="space-y-6">
          {/* Current Assistance */}
          {history.current?.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-blue-50">
                <h2 className="text-lg font-medium text-blue-900">Bantuan yang Sedang Diterima</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {history.current.map((item) => (
                    <div key={item.id} className="flex items-start">
                      <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
                        <FiPackage className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-md font-medium text-gray-900">
                          {item.socialAssistance?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getTypeLabel(item.socialAssistance?.type || '')}
                        </p>
                        <div className="mt-1 flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.isVerified ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                          </span>
                          {item.receivedDate && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Diterima pada {formatDate(item.receivedDate)}
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Past Assistance */}
          {history.past?.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Riwayat Bantuan</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {history.past.map((item) => (
                    <div key={item.id} className="flex items-start">
                      <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
                        <FiPackage className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-md font-medium text-gray-900">
                          {item.socialAssistance?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getTypeLabel(item.socialAssistance?.type || '')}
                        </p>
                        {item.receivedDate && (
                          <p className="text-sm text-gray-500">
                            Diterima pada {formatDate(item.receivedDate)}
                          </p>
                        )}
                        {item.notes && (
                          <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(!history.current?.length && !history.past?.length) && (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              Anda belum pernah menerima bantuan sosial
            </div>
          )}
        </div>
      )}

      {/* Information Section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiInfo className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Informasi Bantuan Sosial</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Kelayakan bantuan sosial ditentukan berdasarkan data yang Anda berikan dan kriteria program bantuan yang tersedia. 
                Untuk informasi lebih lanjut, silakan hubungi pengurus RT atau RW setempat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 