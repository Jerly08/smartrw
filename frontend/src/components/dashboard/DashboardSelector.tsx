import React from 'react';
import { useAuth } from '@/lib/auth';
import AdminDashboard from './AdminDashboard';
import RWDashboard from './RWDashboard';
import RTDashboard from './RTDashboard';
import WargaDashboard from './WargaDashboard';

export default function DashboardSelector() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render dashboard based on user role
  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'RW':
      return <RWDashboard />;
    case 'RT':
      return <RTDashboard />;
    case 'WARGA':
      return <WargaDashboard />;
    default:
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Selamat Datang di Smart RW</h2>
          <p className="text-gray-600">
            Peran Anda tidak dikenali. Silakan hubungi administrator.
          </p>
        </div>
      );
  }
} 