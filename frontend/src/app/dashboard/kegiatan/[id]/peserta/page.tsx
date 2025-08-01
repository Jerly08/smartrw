'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { eventApi } from '@/lib/api';
import { Event, EventParticipant, RSVPStatus, rsvpStatusOptions } from '@/lib/types/event';
import { 
  FiUsers, 
  FiSearch, 
  FiDownload, 
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiCheck,
  FiX,
  FiClock
} from 'react-icons/fi';

export default function EventParticipantsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RSVPStatus | 'ALL'>('ALL');

  const eventId = parseInt(params.id);
  
  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';

  useEffect(() => {
    if (!loading && user) {
      // Only Admin, RW, and RT can manage participants
      if (!isAdmin && !isRW && !isRT) {
        router.push('/dashboard');
        return;
      }

      fetchEventAndParticipants();
    }
  }, [eventId, user, loading, router]);

  const fetchEventAndParticipants = async () => {
    try {
      setIsLoading(true);
      
      // Fetch event details
      const eventData = await eventApi.getEventById(eventId);
      setEvent(eventData);
      
      // Fetch participants
      const participantsData = await eventApi.getEventParticipants(eventId);
      setParticipants(participantsData);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setError('Gagal memuat data kegiatan dan peserta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportParticipants = async () => {
    try {
      await eventApi.exportParticipants(eventId);
    } catch (error) {
      console.error('Error exporting participants:', error);
      setError('Gagal mengunduh data peserta');
    }
  };

  const getRSVPStatusLabel = (status: RSVPStatus) => {
    const statusOption = rsvpStatusOptions.find(option => option.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusOption?.color}`}>
        {statusOption?.label}
      </span>
    );
  };

  const getStatusIcon = (status: RSVPStatus) => {
    switch (status) {
      case RSVPStatus.AKAN_HADIR:
        return <FiCheck className="h-4 w-4 text-green-500" />;
      case RSVPStatus.TIDAK_HADIR:
        return <FiX className="h-4 w-4 text-red-500" />;
      case RSVPStatus.HADIR:
        return <FiClock className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  // Filter participants based on search term and status
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || participant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group participants by status
  const participantsByStatus = {
    AKAN_HADIR: filteredParticipants.filter(p => p.status === RSVPStatus.AKAN_HADIR),
    TIDAK_HADIR: filteredParticipants.filter(p => p.status === RSVPStatus.TIDAK_HADIR),
    HADIR: filteredParticipants.filter(p => p.status === RSVPStatus.HADIR)
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiX className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error || 'Kegiatan tidak ditemukan'}</p>
            <button
              onClick={() => router.back()}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
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
        <h1 className="text-2xl font-bold text-gray-800">Kelola Peserta</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiX className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Event Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{event.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <FiCalendar className="mr-2" />
            {new Date(event.startDate).toLocaleDateString('id-ID')}
          </div>
          <div className="flex items-center">
            <FiMapPin className="mr-2" />
            {event.location}
          </div>
          <div className="flex items-center">
            <FiUsers className="mr-2" />
            {participants.length} peserta terdaftar
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiUsers className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{participants.length}</div>
              <div className="text-sm text-gray-500">Total Peserta</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiCheck className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{participantsByStatus.AKAN_HADIR.length}</div>
              <div className="text-sm text-gray-500">Akan Hadir</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiClock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{participantsByStatus.HADIR.length}</div>
              <div className="text-sm text-gray-500">Hadir</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiX className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{participantsByStatus.TIDAK_HADIR.length}</div>
              <div className="text-sm text-gray-500">Tidak Hadir</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari peserta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RSVPStatus | 'ALL')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Semua Status</option>
              {rsvpStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportParticipants}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiDownload className="mr-2" />
            Unduh Data Peserta
          </button>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Daftar Peserta ({filteredParticipants.length})
          </h3>
        </div>

        {filteredParticipants.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchTerm || statusFilter !== 'ALL' 
              ? 'Tidak ada peserta yang sesuai dengan filter'
              : 'Belum ada peserta yang mendaftar'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peserta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status RSVP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Daftar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {getStatusIcon(participant.status)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {participant.user?.name || 'Nama tidak tersedia'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FiMail className="mr-1 h-3 w-3" />
                            {participant.user?.email || 'Email tidak tersedia'}
                          </div>
                          {participant.user?.phoneNumber && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <FiPhone className="mr-1 h-3 w-3" />
                              {participant.user.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRSVPStatusLabel(participant.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(participant.registeredAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {participant.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
