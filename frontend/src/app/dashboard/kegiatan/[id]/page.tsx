'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { eventApi } from '@/lib/api';
import { Event, EventCategory, RSVPStatus, eventCategoryOptions, rsvpStatusOptions } from '@/lib/types/event';
import { 
  FiCalendar, 
  FiMapPin, 
  FiClock, 
  FiUsers, 
  FiEdit, 
  FiTrash, 
  FiArrowLeft, 
  FiCheck, 
  FiX,
  FiImage,
  FiDownload
} from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRSVP, setUserRSVP] = useState<RSVPStatus | null>(null);

  const eventId = parseInt(params.id);
  
  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';
  const isWarga = user?.role === 'WARGA';

  useEffect(() => {
    if (!loading && user) {
      fetchEvent();
    }
  }, [eventId, user, loading]);

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      const data = await eventApi.getEventById(eventId);
      setEvent(data);
      
      // Check if user has RSVP'd
      if (data.participants) {
        const userParticipation = data.participants.find(p => p.userId === user?.id);
        if (userParticipation) {
          setUserRSVP(userParticipation.status);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Gagal memuat data kegiatan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) {
      return;
    }
    
    try {
      await eventApi.deleteEvent(eventId);
      router.push('/dashboard/kegiatan');
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Gagal menghapus kegiatan');
    }
  };

  const handlePublishEvent = async (isPublished: boolean) => {
    try {
      if (isPublished) {
        await eventApi.unpublishEvent(eventId);
      } else {
        await eventApi.publishEvent(eventId);
      }
      fetchEvent();
    } catch (error) {
      console.error('Error updating event publish status:', error);
      setError('Gagal memperbarui status publikasi kegiatan');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryName = (category: EventCategory) => {
    const categoryOption = eventCategoryOptions.find(option => option.value === category);
    return categoryOption?.label || category;
  };

  const getCategoryColor = (category: EventCategory) => {
    switch (category) {
      case EventCategory.KERJA_BAKTI:
        return 'bg-green-100 text-green-800';
      case EventCategory.RAPAT:
        return 'bg-blue-100 text-blue-800';
      case EventCategory.ARISAN:
        return 'bg-purple-100 text-purple-800';
      case EventCategory.KEAGAMAAN:
        return 'bg-yellow-100 text-yellow-800';
      case EventCategory.OLAHRAGA:
        return 'bg-orange-100 text-orange-800';
      case EventCategory.PERAYAAN:
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isEventCreator = () => {
    return event?.createdBy === user?.id;
  };

  const canManageEvent = () => {
    if (!event) return false;
    if (isAdmin || isRW) return true;
    if (isRT && isEventCreator()) return true;
    return false;
  };

  const getRSVPStatusLabel = (status: RSVPStatus) => {
    const statusOption = rsvpStatusOptions.find(option => option.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusOption?.color}`}>
        {statusOption?.label}
      </span>
    );
  };

  const isEventPassed = () => {
    if (!event) return false;
    return new Date(event.endDate) < new Date();
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
        <h1 className="text-2xl font-bold text-gray-800">Detail Kegiatan</h1>
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

      {/* Event Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                  {getCategoryName(event.category)}
                </span>
                {!event.isPublished && (
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Draft
                  </span>
                )}
                {isEventPassed() && (
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Selesai
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{event.title}</h2>
            </div>
            <div className="mt-4 md:mt-0">
              {userRSVP && (
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-500">Status RSVP:</span>
                  {getRSVPStatusLabel(userRSVP)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <FiCalendar className="mt-1 mr-3 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Tanggal</div>
                <div className="text-gray-600">
                  {formatDate(event.startDate)}
                  {new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString() && (
                    <span> - {formatDate(event.endDate)}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <FiClock className="mt-1 mr-3 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Waktu</div>
                <div className="text-gray-600">
                  {formatTime(event.startDate)} - {formatTime(event.endDate)}
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <FiMapPin className="mt-1 mr-3 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Lokasi</div>
                <div className="text-gray-600">{event.location}</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <FiUsers className="mt-1 mr-3 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Peserta</div>
                <div className="text-gray-600">
                  {event.participantCount ? (
                    <>
                      <span className="font-medium">{event.participantCount.total}</span> peserta
                      {event.participantCount.akanHadir > 0 && (
                        <span className="ml-2 text-green-600">
                          ({event.participantCount.akanHadir} akan hadir)
                        </span>
                      )}
                    </>
                  ) : (
                    'Belum ada peserta'
                  )}
                </div>
              </div>
            </div>
          </div>

          {event.targetRTs && (
            <div className="mt-4 flex items-start">
              <FiUsers className="mt-1 mr-3 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Target RT</div>
                <div className="text-gray-600">
                  {JSON.parse(event.targetRTs).length > 0 
                    ? JSON.parse(event.targetRTs).map((rt: string) => `RT ${rt}`).join(', ')
                    : 'Semua RT'}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Deskripsi</h3>
            <div className="prose max-w-none">
              <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>

          {/* Event Photos */}
          {event.photos && event.photos.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Dokumentasi</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {event.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                    <img
                      src={photo.photoUrl}
                      alt={photo.caption || 'Dokumentasi kegiatan'}
                      className="object-cover w-full h-full"
                    />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            {/* RSVP button for Warga */}
            {isWarga && !isEventPassed() && (
              <Link href={`/dashboard/kegiatan/${event.id}/rsvp`} className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100">
                <FiCheck className="mr-2" /> {userRSVP ? 'Ubah RSVP' : 'RSVP'}
              </Link>
            )}
            
            {/* Management buttons for Admin, RW, and event creator (RT) */}
            {canManageEvent() && (
              <>
                <Link href={`/dashboard/kegiatan/${event.id}/edit`} className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                  <FiEdit className="mr-2" /> Edit
                </Link>
                
                <button
                  onClick={() => handlePublishEvent(event.isPublished)}
                  className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                    event.isPublished
                      ? 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100'
                      : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {event.isPublished ? (
                    <>
                      <FiX className="mr-2" /> Batalkan Publikasi
                    </>
                  ) : (
                    <>
                      <FiCheck className="mr-2" /> Publikasikan
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleDeleteEvent}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                >
                  <FiTrash className="mr-2" /> Hapus
                </button>
                
                <Link href={`/dashboard/kegiatan/${event.id}/peserta`} className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100">
                  <FiUsers className="mr-2" /> Kelola Peserta
                </Link>
                
                <button
                  onClick={handleExportParticipants}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FiDownload className="mr-2" /> Unduh Data Peserta
                </button>
                
                {isEventPassed() && (
                  <Link href={`/dashboard/kegiatan/${event.id}/dokumentasi`} className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                    <FiImage className="mr-2" /> Unggah Dokumentasi
                  </Link>
                )}
              </>
            )}
            
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiArrowLeft className="mr-2" /> Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 