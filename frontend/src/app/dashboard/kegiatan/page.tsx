'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { eventApi } from '@/lib/api';
import { Event, EventCategory, eventCategoryOptions } from '@/lib/types/event';
import { 
  FiCalendar, 
  FiMapPin, 
  FiClock, 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit, 
  FiTrash, 
  FiEye, 
  FiUsers,
  FiCheck,
  FiX
} from 'react-icons/fi';
import Link from 'next/link';

export default function EventsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    isUpcoming: true,
  });

  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';
  const isWarga = user?.role === 'WARGA';

  useEffect(() => {
    if (!loading && user) {
      fetchEvents();
    }
  }, [user, loading]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const params: any = { ...filters };
      
      // For RT, only show events from their RT or events targeting their RT
      if (isRT && user?.resident?.rtNumber) {
        params.rtNumber = user.resident.rtNumber;
      }
      
      const response = await eventApi.getAllEvents(params);
      setEvents(response.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Gagal memuat data kegiatan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    if (e.target.name === 'isUpcoming') {
      setFilters({
        ...filters,
        isUpcoming: e.target.checked,
      });
    } else {
      setFilters({
        ...filters,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) {
      return;
    }
    
    try {
      await eventApi.deleteEvent(id);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Gagal menghapus kegiatan');
    }
  };

  const handlePublishEvent = async (id: number, isPublished: boolean) => {
    try {
      if (isPublished) {
        await eventApi.unpublishEvent(id);
      } else {
        await eventApi.publishEvent(id);
      }
      fetchEvents();
    } catch (error) {
      console.error('Error updating event publish status:', error);
      setError('Gagal memperbarui status publikasi kegiatan');
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

  const isEventCreator = (event: Event) => {
    return event.createdBy === user?.id;
  };

  const canManageEvent = (event: Event) => {
    if (isAdmin || isRW) return true;
    if (isRT && isEventCreator(event)) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Agenda & Kegiatan</h1>
        
        {/* Only show create button for Admin, RW, and RT */}
        {(isAdmin || isRW || isRT) && (
          <Link href="/dashboard/kegiatan/buat" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2" /> Buat Kegiatan Baru
          </Link>
        )}
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
            <div className="relative">
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Cari berdasarkan judul atau deskripsi..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Semua Kategori</option>
                {eventCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <FiFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="w-full md:w-48 flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isUpcoming"
                checked={filters.isUpcoming}
                onChange={handleFilterChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Hanya kegiatan mendatang</span>
            </label>
          </div>
          
          <div className="self-end">
            <button
              type="submit"
              className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Tidak ada kegiatan yang ditemukan
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
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
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">{event.title}</h2>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center">
                    {event.participantCount && (
                      <div className="mr-4 flex items-center text-gray-500">
                        <FiUsers className="mr-1" />
                        <span>{event.participantCount.total} peserta</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <FiCalendar className="mt-1 mr-2 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Tanggal</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(event.startDate)}
                        {new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString() && (
                          <span> - {formatDate(event.endDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FiClock className="mt-1 mr-2 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Waktu</div>
                      <div className="text-sm text-gray-500">
                        {formatTime(event.startDate)} - {formatTime(event.endDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FiMapPin className="mt-1 mr-2 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Lokasi</div>
                      <div className="text-sm text-gray-500">{event.location}</div>
                    </div>
                  </div>
                  
                  {event.targetRTs && (
                    <div className="flex items-start">
                      <FiUsers className="mt-1 mr-2 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">Target RT</div>
                        <div className="text-sm text-gray-500">
                          {JSON.parse(event.targetRTs).length > 0 
                            ? JSON.parse(event.targetRTs).map((rt: string) => `RT ${rt}`).join(', ')
                            : 'Semua RT'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-600 line-clamp-2">{event.description}</p>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href={`/dashboard/kegiatan/${event.id}`} className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <FiEye className="mr-1" /> Detail
                  </Link>
                  
                  {/* Admin, RW, and event creator (RT) can manage the event */}
                  {canManageEvent(event) && (
                    <>
                      <Link href={`/dashboard/kegiatan/${event.id}/edit`} className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                        <FiEdit className="mr-1" /> Edit
                      </Link>
                      
                      <button
                        onClick={() => handlePublishEvent(event.id, event.isPublished)}
                        className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                          event.isPublished
                            ? 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100'
                            : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {event.isPublished ? (
                          <>
                            <FiX className="mr-1" /> Batalkan Publikasi
                          </>
                        ) : (
                          <>
                            <FiCheck className="mr-1" /> Publikasikan
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <FiTrash className="mr-1" /> Hapus
                      </button>
                      
                      {/* Admin and RW can view participants */}
                      {(isAdmin || isRW || isRT) && (
                        <Link href={`/dashboard/kegiatan/${event.id}/peserta`} className="inline-flex items-center px-3 py-1.5 border border-purple-300 rounded-md text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100">
                          <FiUsers className="mr-1" /> Peserta
                        </Link>
                      )}
                    </>
                  )}
                  
                  {/* RSVP button for Warga */}
                  {isWarga && new Date(event.endDate) > new Date() && (
                    <Link href={`/dashboard/kegiatan/${event.id}/rsvp`} className="inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100">
                      <FiCheck className="mr-1" /> RSVP
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 