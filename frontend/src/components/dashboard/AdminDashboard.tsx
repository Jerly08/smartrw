import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiFileText,
  FiAlertCircle,
  FiCalendar,
  FiPackage,
  FiActivity,
  FiServer,
  FiShield,
  FiSettings
} from 'react-icons/fi';
import api from '@/lib/api';

// Types for dashboard statistics
interface AdminStats {
  users: {
    total: number;
    byRole: {
      role: string;
      count: number;
    }[];
  };
  residents: {
    total: number;
    verified: number;
    byRT: {
      rtNumber: string;
      count: number;
    }[];
  };
  documents: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  complaints: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  events: {
    upcoming: number;
    past: number;
  };
  assistance: {
    active: number;
    distributed: number;
  };
  system: {
    uptime: string;
    lastBackup: string;
    status: 'healthy' | 'warning' | 'critical';
  };
}

// Default empty stats
const defaultAdminStats: AdminStats = {
  users: {
    total: 0,
    byRole: []
  },
  residents: {
    total: 0,
    verified: 0,
    byRT: []
  },
  documents: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  },
  complaints: {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  },
  events: {
    upcoming: 0,
    past: 0
  },
  assistance: {
    active: 0,
    distributed: 0
  },
  system: {
    uptime: '0 days',
    lastBackup: '-',
    status: 'healthy'
  }
};

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>(defaultAdminStats);
  const [loading, setLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch admin dashboard statistics
        const [userStats, residentStats, documentStats, complaintStats, eventStats, assistanceStats] = await Promise.all([
          api.get('/users/statistics'),
          api.get('/residents/statistics'),
          api.get('/documents/statistics'),
          api.get('/complaints/statistics'),
          api.get('/events/statistics'),
          api.get('/social-assistance/statistics')
        ]);

        // Build comprehensive admin stats
        const adminStats: AdminStats = {
          users: {
            total: userStats.data?.data?.total || 0,
            byRole: userStats.data?.data?.byRole || []
          },
          residents: {
            total: residentStats.data?.data?.total || 0,
            verified: residentStats.data?.data?.verified || 0,
            byRT: residentStats.data?.data?.byRT || []
          },
          documents: {
            total: documentStats.data?.data?.total || 0,
            pending: documentStats.data?.data?.pending || 0,
            approved: documentStats.data?.data?.approved || 0,
            rejected: documentStats.data?.data?.rejected || 0
          },
          complaints: {
            total: complaintStats.data?.data?.total || 0,
            open: complaintStats.data?.data?.open || 0,
            inProgress: complaintStats.data?.data?.inProgress || 0,
            resolved: complaintStats.data?.data?.resolved || 0
          },
          events: {
            upcoming: eventStats.data?.data?.upcoming || 0,
            past: eventStats.data?.data?.past || 0
          },
          assistance: {
            active: assistanceStats.data?.data?.active || 0,
            distributed: assistanceStats.data?.data?.distributed || 0
          },
          system: {
            uptime: '15 days', // This would come from system API
            lastBackup: new Date().toISOString().split('T')[0], // Current date as placeholder
            status: 'healthy'
          }
        };

        setStats(adminStats);

        // Fetch recent activities
        try {
          const activitiesResponse = await api.get('/admin/activities/recent');
          setRecentActivities(activitiesResponse.data?.data || []);
        } catch (err) {
          console.error('Gagal mengambil aktivitas terbaru:', err);
          setRecentActivities([]);
        }

      } catch (error) {
        console.error('Gagal mengambil data dashboard admin:', error);
        setStats(defaultAdminStats);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiServer className="mr-2" /> Status Sistem
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Uptime</p>
                <p className="text-xl font-semibold">{stats.system.uptime}</p>
              </div>
              <FiActivity className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Backup Terakhir</p>
                <p className="text-xl font-semibold">{stats.system.lastBackup}</p>
              </div>
              <FiShield className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className={`p-4 ${
            stats.system.status === 'healthy' ? 'bg-green-50' : 
            stats.system.status === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
          } rounded-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`text-xl font-semibold ${
                  stats.system.status === 'healthy' ? 'text-green-600' : 
                  stats.system.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.system.status === 'healthy' ? 'Sehat' : 
                   stats.system.status === 'warning' ? 'Perhatian' : 'Kritis'}
                </p>
              </div>
              <FiSettings className={`h-8 w-8 ${
                stats.system.status === 'healthy' ? 'text-green-500' : 
                stats.system.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Pengguna</h3>
            <FiUsers className="h-6 w-6 text-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className="text-xl font-bold">{stats.users.total}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            {stats.users.byRole.map((role, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{role.role}</span>
                <span className="font-medium">{role.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Documents Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Dokumen</h3>
            <FiFileText className="h-6 w-6 text-green-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className="text-xl font-bold">{stats.documents.total}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between items-center text-sm">
              <span>Menunggu</span>
              <span className="font-medium text-yellow-600">{stats.documents.pending}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Disetujui</span>
              <span className="font-medium text-green-600">{stats.documents.approved}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Ditolak</span>
              <span className="font-medium text-red-600">{stats.documents.rejected}</span>
            </div>
          </div>
        </div>

        {/* Complaints Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Pengaduan</h3>
            <FiAlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className="text-xl font-bold">{stats.complaints.total}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between items-center text-sm">
              <span>Baru</span>
              <span className="font-medium text-yellow-600">{stats.complaints.open}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Dalam Proses</span>
              <span className="font-medium text-blue-600">{stats.complaints.inProgress}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Selesai</span>
              <span className="font-medium text-green-600">{stats.complaints.resolved}</span>
            </div>
          </div>
        </div>

        {/* Events and Assistance Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Kegiatan & Bantuan</h3>
            <div className="flex space-x-2">
              <FiCalendar className="h-6 w-6 text-purple-500" />
              <FiPackage className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Kegiatan Mendatang</span>
              <span className="text-xl font-bold">{stats.events.upcoming}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Kegiatan Selesai</span>
              <span className="text-lg">{stats.events.past}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bantuan Aktif</span>
              <span className="text-xl font-bold">{stats.assistance.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bantuan Tersalurkan</span>
              <span className="text-lg">{stats.assistance.distributed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Aktivitas Terbaru</h2>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FiActivity className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <p className="font-medium">{activity.user}</p>
                    <p className="text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
                  </div>
                  <p className="text-gray-600">{activity.action}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FiActivity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada aktivitas terbaru</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors">
            <FiUsers className="h-6 w-6 text-blue-500 mb-2" />
            <span className="text-sm font-medium">Kelola Pengguna</span>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg flex flex-col items-center justify-center transition-colors">
            <FiFileText className="h-6 w-6 text-green-500 mb-2" />
            <span className="text-sm font-medium">Dokumen Tertunda</span>
          </button>
          <button className="p-4 bg-red-50 hover:bg-red-100 rounded-lg flex flex-col items-center justify-center transition-colors">
            <FiAlertCircle className="h-6 w-6 text-red-500 mb-2" />
            <span className="text-sm font-medium">Pengaduan Baru</span>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col items-center justify-center transition-colors">
            <FiSettings className="h-6 w-6 text-purple-500 mb-2" />
            <span className="text-sm font-medium">Pengaturan Sistem</span>
          </button>
        </div>
      </div>
    </div>
  );
} 