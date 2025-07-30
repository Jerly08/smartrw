'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MapPin, Phone, Mail, User, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface VerificationPendingBannerProps {
  onCompleteProfile?: () => void;
  onSelectRT?: () => void;
}

export default function VerificationPendingBanner({ 
  onCompleteProfile, 
  onSelectRT 
}: VerificationPendingBannerProps) {
  const { user } = useAuth();
  const [residentData, setResidentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResidentData = async () => {
      try {
        if (!user?.id) return;
        
        const response = await fetch('/api/residents/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setResidentData(data.data.user.resident);
        }
      } catch (error) {
        console.error('Error fetching resident data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResidentData();
  }, [user]);

  const getVerificationStatus = () => {
    if (!residentData) return 'no_profile';
    if (!residentData.isVerified) return 'pending_verification';
    return 'verified';
  };

  const getIncompleteFields = () => {
    if (!residentData) return [];
    
    const requiredFields = [
      { key: 'phoneNumber', label: 'Nomor Telepon', icon: Phone },
      { key: 'occupation', label: 'Pekerjaan', icon: User },
      { key: 'education', label: 'Pendidikan', icon: FileText },
    ];

    return requiredFields.filter(field => !residentData[field.key]);
  };

  const getSelectedRT = () => {
    if (!residentData?.rtNumber) return null;
    return {
      number: residentData.rtNumber,
      name: `RT ${residentData.rtNumber.padStart(3, '0')}`,
      address: residentData.address || 'Alamat belum tersedia'
    };
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const status = getVerificationStatus();
  const incompleteFields = getIncompleteFields();
  const selectedRT = getSelectedRT();

  if (status === 'verified') {
    return null; // Don't show for verified residents
  }

  // Simple Badge component
  const Badge = ({ variant, className, children }: any) => (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${className}`}>
      {children}
    </span>
  );

  // Simple Button component
  const Button = ({ size, variant, className, onClick, children }: any) => (
    <button 
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${className} ${
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
      } ${
        variant === 'outline' ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50' : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );

  // Simple Card components
  const Card = ({ className, children }: any) => (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ className, children }: any) => (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );

  const CardTitle = ({ className, children }: any) => (
    <h3 className={`font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );

  const CardContent = ({ className, children }: any) => (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="space-y-4 mb-6">
      {/* Main Status Alert */}
      <div className="relative w-full rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <div className="flex items-start">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {status === 'no_profile' 
                    ? 'Profil Belum Lengkap' 
                    : 'Menunggu Verifikasi RT'
                  }
                </p>
                <p className="text-sm mt-1">
                  {status === 'no_profile'
                    ? 'Lengkapi data profil dan pilih RT untuk mendapatkan akses penuh ke layanan.'
                    : 'Data Anda sedang dalam proses verifikasi oleh pengurus RT. Mohon tunggu konfirmasi.'
                  }
                </p>
              </div>
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100">
                <Clock className="w-3 h-3 mr-1" />
                {status === 'no_profile' ? 'Belum Lengkap' : 'Pending'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Status Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Profile Completion Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <User className="w-4 h-4 mr-2" />
              Status Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incompleteFields.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Data yang belum lengkap:
                </p>
                <div className="space-y-2">
                  {incompleteFields.map((field) => (
                    <div key={field.key} className="flex items-center text-sm">
                      <field.icon className="w-3 h-3 mr-2 text-gray-400" />
                      <span className="text-gray-600">{field.label}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Kosong
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={onCompleteProfile}
                >
                  Lengkapi Profil
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Profil sudah lengkap
                </div>
                <p className="text-xs text-gray-500">
                  Semua data profil sudah terisi dengan baik
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RT Selection Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Status RT
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRT ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{selectedRT.name}</span>
                    <Badge 
                      variant={residentData?.isVerified ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {residentData?.isVerified ? 'Terverifikasi' : 'Menunggu'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedRT.address}
                  </p>
                </div>
                
                {!residentData?.isVerified && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <Clock className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Menunggu Verifikasi
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          RT Anda akan memverifikasi data dalam 1-3 hari kerja
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Belum memilih RT
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={onSelectRT}
                >
                  Pilih RT
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contact Info Card */}
      {residentData && !residentData.isVerified && selectedRT && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start">
              <Mail className="w-4 h-4 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Butuh bantuan?
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Hubungi pengurus RT di nomor telepon atau datang langsung ke kantor RT untuk mempercepat proses verifikasi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
