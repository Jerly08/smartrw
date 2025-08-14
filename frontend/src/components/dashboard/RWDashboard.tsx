import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiFileText,
  FiAlertCircle,
  FiCalendar,
  FiPackage,
  FiTrendingUp,
  FiMapPin,
  FiBarChart2,
  FiMessageSquare
} from 'react-icons/fi';
import { dashboardApi } from '@/lib/api';

// Types for RW dashboard statistics
interface RWStats {
  residents: {
    total: number;
    byRT: {
      rtNumber: string;
      count: number;
      verified: number;
    }[];
  };
  documents: {
    incoming: number;
    outgoing: number;
    pending: number;
  };
  complaints: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  events: {
    upcoming: number;
    total: number;
  };
  assistance: {
    active: number;
    recipients: number;
  };
}


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

// Format short date helper (without time)
const formatShortDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

// Get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Disetujui':
    case 'Selesai':
      return 'bg-green-100 text-green-800';
    case 'Diproses':
    case 'Menunggu':
      return 'bg-yellow-100 text-yellow-800';
    case 'Ditolak':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function RWDashboard() {
  const [stats, setStats] = useState<RWStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all dashboard data in parallel
        const [statsResponse, eventsResponse, documentsResponse] = await Promise.all([
          dashboardApi.getRWDashboardStats(),
          dashboardApi.getRWUpcomingEvents(5),
          dashboardApi.getRWRecentDocuments(5)
        ]);
        
        setStats(statsResponse);
        setUpcomingEvents(eventsResponse);
        setRecentDocuments(documentsResponse);
      } catch (error) {
        console.error('Gagal mengambil data dashboard RW:', error);
        setError('Gagal memuat data dashboard. Silakan coba lagi.');
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Kesalahan</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Tidak Ada Data</h3>
        <p>Data dashboard tidak tersedia</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Warga Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Total Warga</h3>
            <FiUsers className="h-6 w-6 text-blue-500" />
          </div>
          <div className="text-3xl font-bold mb-4">{stats.residents.total}</div>
          <div className="space-y-2">
            {stats.residents.byRT.map((rt) => (
              <div key={rt.rtNumber} className="flex justify-between items-center text-sm">
                <span>RT {rt.rtNumber}</span>
                <div className="flex items-center">
                  <span className="font-medium">{rt.count}</span>
                  <span className="text-xs text-green-600 ml-2">
                    ({Math.round((rt.verified / rt.count) * 100)}% terverifikasi)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dokumen Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Dokumen</h3>
            <FiFileText className="h-6 w-6 text-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Surat Masuk</div>
              <div className="text-2xl font-bold">{stats.documents.incoming}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Surat Keluar</div>
              <div className="text-2xl font-bold">{stats.documents.outgoing}</div>
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Menunggu Persetujuan</div>
            <div className="text-2xl font-bold">{stats.documents.pending}</div>
          </div>
        </div>

        {/* Pengaduan Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Pengaduan</h3>
            <FiAlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="text-3xl font-bold mb-4">{stats.complaints.total}</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Baru</span>
              <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                {stats.complaints.open}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Dalam Proses</span>
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                {stats.complaints.inProgress}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Selesai</span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                {stats.complaints.resolved}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kegiatan Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Kegiatan Mendatang</h3>
            <FiCalendar className="h-6 w-6 text-purple-500" />
          </div>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="border-l-4 border-purple-400 pl-4 py-2">
                <div className="font-medium">{event.title}</div>
                <div className="flex justify-between text-sm">
                  <div className="text-gray-600">
                    <FiCalendar className="inline-block mr-1" />
                    {formatShortDate(event.date)}
                  </div>
                  <div className="text-gray-600">
                    <FiMapPin className="inline-block mr-1" />
                    {event.location}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <FiUsers className="inline-block mr-1" />
                  {event.participants} peserta terdaftar
                </div>
              </div>
            ))}
            <div className="text-center mt-2">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Lihat Semua Kegiatan ({stats.events.total})
              </button>
            </div>
          </div>
        </div>

        {/* Bantuan Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Bantuan Sosial</h3>
            <FiPackage className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600">Program Aktif</div>
              <div className="text-2xl font-bold">{stats.assistance.active}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600">Total Penerima</div>
              <div className="text-2xl font-bold">{stats.assistance.recipients}</div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-medium mb-2">Distribusi Penerima</h4>
            <div className="space-y-2">
              {stats.residents.byRT.map((rt) => (
                <div key={rt.rtNumber} className="flex items-center">
                  <div className="w-20 text-sm">RT {rt.rtNumber}</div>
                  <div className="flex-grow h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400" 
                      style={{ width: `${Math.round((rt.count / stats.residents.total) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="w-10 text-right text-sm">
                    {Math.round((rt.count / stats.residents.total) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Dokumen Terbaru</h2>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Lihat Semua
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Dokumen
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pemohon
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RT
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {doc.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.requester}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.rt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatShortDate(doc.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">Lihat</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors">
            <FiFileText className="h-6 w-6 text-blue-500 mb-2" />
            <span className="text-sm font-medium">Dokumen Tertunda</span>
          </button>
          <button className="p-4 bg-red-50 hover:bg-red-100 rounded-lg flex flex-col items-center justify-center transition-colors">
            <FiAlertCircle className="h-6 w-6 text-red-500 mb-2" />
            <span className="text-sm font-medium">Pengaduan Baru</span>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col items-center justify-center transition-colors">
            <FiCalendar className="h-6 w-6 text-purple-500 mb-2" />
            <span className="text-sm font-medium">Buat Kegiatan</span>
          </button>
          <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg flex flex-col items-center justify-center transition-colors">
            <FiMessageSquare className="h-6 w-6 text-yellow-500 mb-2" />
            <span className="text-sm font-medium">Pengumuman</span>
          </button>
        </div>
      </div>
    </div>
  );
} 