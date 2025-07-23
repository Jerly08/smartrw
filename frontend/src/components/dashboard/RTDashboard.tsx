import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiFileText,
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiMapPin,
  FiMessageSquare,
  FiClock,
  FiBell
} from 'react-icons/fi';
import api, { dashboardApi } from '@/lib/api';
import { RTDashboardStats, PendingVerification, PendingDocument, UpcomingEvent } from '@/lib/types/dashboard';
import { useRouter } from 'next/navigation';
import RTNotifications from './RTNotifications';

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

// Format time only helper
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function RTDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<RTDashboardStats | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get RT dashboard statistics
        const statsData = await dashboardApi.getRTDashboardStats();
        setStats(statsData);
        
        // Get pending verifications
        const verificationsData = await dashboardApi.getRTPendingVerifications({ limit: 5 });
        setPendingVerifications(verificationsData.verifications);
        
        // Get pending documents
        const documentsData = await dashboardApi.getRTPendingDocuments({ limit: 5 });
        setPendingDocuments(documentsData.documents);
        
        // Get upcoming events
        const eventsData = await dashboardApi.getRTUpcomingEvents({ limit: 5 });
        setUpcomingEvents(eventsData.events);
      } catch (err) {
        console.error('Failed to fetch RT dashboard data:', err);
        setError('Gagal memuat data dashboard. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle verification process
  const handleVerification = async (id: number, action: 'approve' | 'reject') => {
    try {
      await dashboardApi.processVerification(id, action);
      
      // Refresh verifications after processing
      const verificationsData = await dashboardApi.getRTPendingVerifications({ limit: 5 });
      setPendingVerifications(verificationsData.verifications);
      
      // Refresh stats
      const statsData = await dashboardApi.getRTDashboardStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to process verification:', err);
      setError('Gagal memproses verifikasi. Silakan coba lagi nanti.');
    }
  };

  // Handle document recommendation
  const handleDocumentRecommendation = async (id: number, action: 'approve' | 'reject') => {
    try {
      await dashboardApi.processDocumentRecommendation(id, action);
      
      // Refresh documents after processing
      const documentsData = await dashboardApi.getRTPendingDocuments({ limit: 5 });
      setPendingDocuments(documentsData.documents);
      
      // Refresh stats
      const statsData = await dashboardApi.getRTDashboardStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to process document recommendation:', err);
      setError('Gagal memproses rekomendasi dokumen. Silakan coba lagi nanti.');
    }
  };

  // Navigation handlers
  const navigateToWarga = () => router.push('/dashboard/warga');
  const navigateToDocuments = () => router.push('/dashboard/surat');
  const navigateToComplaints = () => router.push('/dashboard/pengaduan');
  const navigateToEvents = () => router.push('/dashboard/kegiatan');
  const navigateToForum = () => router.push('/dashboard/forum');
  const navigateToNotifications = () => router.push('/dashboard/notifikasi');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <h3 className="text-lg font-medium">Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
        <h3 className="text-lg font-medium">Data Tidak Tersedia</h3>
        <p>Data dashboard tidak tersedia. Silakan coba lagi nanti.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* RT Info Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">RT {stats.rtNumber}/RW {stats.rwNumber}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Total Warga</h3>
              <FiUsers className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{stats.residents.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Terverifikasi</h3>
              <FiCheck className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{stats.residents.verified}</p>
            <p className="text-xs text-green-600">
              {Math.round((stats.residents.verified / stats.residents.total) * 100)}% dari total
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Belum Verifikasi</h3>
              <FiClock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">{stats.residents.unverified}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Jumlah KK</h3>
              <FiUsers className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{stats.residents.families}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifications Card */}
        <RTNotifications />

        {/* Pending Verifications Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Verifikasi Warga Tertunda</h3>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              {pendingVerifications.length} tertunda
            </span>
          </div>
          
          {pendingVerifications.length > 0 ? (
            <div className="space-y-4">
              {pendingVerifications.map((verification) => (
                <div key={verification.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{verification.name}</h4>
                    <span className="text-xs text-gray-500">{formatDate(verification.submittedAt)}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>NIK: {verification.nik}</p>
                    <p>Alamat: {verification.address}</p>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button 
                      onClick={() => handleVerification(verification.id, 'approve')}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                    >
                      Verifikasi
                    </button>
                    <button 
                      onClick={() => handleVerification(verification.id, 'reject')}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Tidak ada verifikasi warga tertunda</p>
            </div>
          )}
          
          {pendingVerifications.length > 0 && (
            <div className="mt-4 text-center">
              <button 
                onClick={navigateToWarga}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Lihat Semua Permintaan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Recommendations Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Rekomendasi Dokumen</h3>
            <div className="flex items-center">
              <FiFileText className="h-5 w-5 text-green-500 mr-1" />
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {pendingDocuments.length} tertunda
              </span>
            </div>
          </div>
          
          {pendingDocuments.length > 0 ? (
            <div className="space-y-3">
              {pendingDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg">
                  <div>
                    <h4 className="font-medium">{document.type}</h4>
                    <p className="text-sm text-gray-600">Pemohon: {document.requester}</p>
                    <p className="text-xs text-gray-500">{formatDate(document.submittedAt)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleDocumentRecommendation(document.id, 'approve')}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                    >
                      Setuju
                    </button>
                    <button 
                      onClick={() => handleDocumentRecommendation(document.id, 'reject')}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Tidak ada rekomendasi dokumen tertunda</p>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <button 
              onClick={navigateToDocuments}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Lihat Semua Dokumen ({stats.documents.total})
            </button>
          </div>
        </div>

        {/* Events Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Kegiatan Mendatang</h3>
            <FiCalendar className="h-5 w-5 text-purple-500" />
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border-l-4 border-purple-400 pl-4 py-2">
                  <div className="font-medium">{event.title}</div>
                  <div className="flex justify-between text-sm mt-1">
                    <div className="text-gray-600">
                      <FiCalendar className="inline-block mr-1" />
                      {formatShortDate(event.date)}
                    </div>
                    <div className="text-gray-600">
                      <FiClock className="inline-block mr-1" />
                      {formatTime(event.date)}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <div className="text-gray-600">
                      <FiMapPin className="inline-block mr-1" />
                      {event.location}
                    </div>
                    <div className="text-gray-600">
                      <FiUsers className="inline-block mr-1" />
                      {event.participants} peserta
                    </div>
                  </div>
                  <div className="mt-3">
                    <button 
                      onClick={() => router.push(`/dashboard/kegiatan/${event.id}`)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors"
                    >
                      Detail Kegiatan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Tidak ada kegiatan mendatang</p>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <button 
              onClick={navigateToEvents}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              Buat Kegiatan Baru
            </button>
          </div>
        </div>
      </div>

      {/* Complaints Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Pengaduan</h3>
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-red-500 mr-1" />
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {stats.complaints.open} baru
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-8 py-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">{stats.complaints.open}</div>
            <div className="text-sm text-gray-600 mt-1">Belum Ditanggapi</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.complaints.total - stats.complaints.open}</div>
            <div className="text-sm text-gray-600 mt-1">Sudah Ditanggapi</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">{stats.complaints.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Pengaduan</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <button 
            onClick={navigateToComplaints}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Lihat Pengaduan Baru
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button 
            onClick={navigateToWarga}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors"
          >
            <FiUsers className="h-6 w-6 text-blue-500 mb-2" />
            <span className="text-sm font-medium">Data Warga</span>
          </button>
          <button 
            onClick={navigateToDocuments}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg flex flex-col items-center justify-center transition-colors"
          >
            <FiFileText className="h-6 w-6 text-green-500 mb-2" />
            <span className="text-sm font-medium">Rekomendasi</span>
          </button>
          <button 
            onClick={navigateToComplaints}
            className="p-4 bg-red-50 hover:bg-red-100 rounded-lg flex flex-col items-center justify-center transition-colors"
          >
            <FiAlertCircle className="h-6 w-6 text-red-500 mb-2" />
            <span className="text-sm font-medium">Pengaduan</span>
          </button>
          <button 
            onClick={navigateToForum}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col items-center justify-center transition-colors"
          >
            <FiMessageSquare className="h-6 w-6 text-purple-500 mb-2" />
            <span className="text-sm font-medium">Forum RT</span>
          </button>
          <button 
            onClick={navigateToNotifications}
            className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg flex flex-col items-center justify-center transition-colors"
          >
            <FiBell className="h-6 w-6 text-amber-500 mb-2" />
            <span className="text-sm font-medium">Notifikasi</span>
          </button>
        </div>
      </div>
    </div>
  );
} 