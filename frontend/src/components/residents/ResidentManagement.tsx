import React from 'react';
import { useAuth } from '@/lib/auth';
import AdminResidentManagement from './AdminResidentManagement';
import RTResidentManagement from './RTResidentManagement';
import WargaResidentView from './WargaResidentView';

export default function ResidentManagement() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render appropriate component based on user role
  switch (user.role) {
    case 'ADMIN':
    case 'RW':
      return <AdminResidentManagement />;
    case 'RT':
      return <RTResidentManagement />;
    case 'WARGA':
      return <WargaResidentView />;
    default:
      return (
        <div className="p-6 bg-white shadow rounded-lg">
          <h1 className="text-xl font-semibold mb-4">Akses Tidak Tersedia</h1>
          <p className="text-gray-600">Anda tidak memiliki akses untuk melihat data penduduk.</p>
        </div>
      );
  }
} 