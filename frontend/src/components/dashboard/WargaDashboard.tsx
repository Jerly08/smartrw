'use client';

import React from 'react';
import {
  FiFileText,
  FiAlertCircle,
  FiCalendar,
  FiMessageSquare,
  FiPackage,
  FiClock,
  FiMapPin,
  FiCheck,
  FiX,
  FiInfo,
  FiArrowRight,
  FiRefreshCw
} from 'react-icons/fi';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { DocumentStatus } from '@/lib/types/document';

// Get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case DocumentStatus.DISETUJUI:
    case DocumentStatus.SELESAI:
      return 'bg-green-100 text-green-800';
    case DocumentStatus.DIAJUKAN:
    case DocumentStatus.DIPROSES:
      return 'bg-yellow-100 text-yellow-800';
    case DocumentStatus.DITOLAK:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get status name
const getStatusName = (status: string) => {
  switch (status) {
    case DocumentStatus.DIAJUKAN:
      return 'Menunggu';
    case DocumentStatus.DIPROSES:
      return 'Diproses';
    case DocumentStatus.DISETUJUI:
      return 'Disetujui';
    case DocumentStatus.DITANDATANGANI:
      return 'Ditandatangani';
    case DocumentStatus.DITOLAK:
      return 'Ditolak';
    case DocumentStatus.SELESAI:
      return 'Selesai';
    default:
      return status;
  }
};

// Get document type name
const getDocumentTypeName = (type: string) => {
  switch (type) {
    case 'DOMISILI':
      return 'Surat Keterangan Domisili';
    case 'PENGANTAR_SKCK':
      return 'Surat Pengantar SKCK';
    case 'TIDAK_MAMPU':
      return 'Surat Keterangan Tidak Mampu';
    case 'USAHA':
      return 'Surat Keterangan Usaha';
    case 'KELAHIRAN':
      return 'Surat Keterangan Kelahiran';
    case 'KEMATIAN':
      return 'Surat Keterangan Kematian';
    case 'PINDAH':
      return 'Surat Keterangan Pindah';
    default:
      return type;
  }
};

export default function WargaDashboard() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { dashboardData, handleRsvp, refreshData } = useDashboardData();
  
  const { documents, events, announcements } = dashboardData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button 
          onClick={refreshData}
          className="flex items-center px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
        >
          <FiRefreshCw className="mr-1.5" /> Refresh
        </button>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiFileText className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Dokumen</h2>
              <p className="text-gray-600">
                {documents.pending} menunggu dari {documents.items.length} dokumen
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FiCalendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Kegiatan</h2>
              <p className="text-gray-600">
                {events.items.length} kegiatan mendatang
              </p>
              </div>
                </div>
              </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FiInfo className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Notifikasi</h2>
              <p className="text-gray-600">
                {unreadCount} notifikasi belum dibaca
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pengajuan Dokumen</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {documents.pending} menunggu
            </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Dokumen
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Pengajuan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : documents.error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-red-500">
                    {documents.error}
                  </td>
                </tr>
              ) : documents.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada dokumen yang diajukan
                  </td>
                </tr>
              ) : (
                documents.items.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getDocumentTypeName(doc.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                        {getStatusName(doc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/dashboard/surat/${doc.id}`} className="text-blue-600 hover:text-blue-900">
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Link href="/dashboard/surat" className="text-sm text-blue-600 hover:text-blue-900 font-medium flex items-center">
            Lihat Semua Dokumen ({documents.items.length})
            <FiArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="p-6 border-t border-gray-200">
          <Link href="/dashboard/surat/buat" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Ajukan Dokumen Baru
          </Link>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Kegiatan Mendatang</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {events.loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-sm text-gray-500">Memuat kegiatan...</p>
            </div>
          ) : events.error ? (
            <div className="p-6 text-center text-red-500">
              {events.error}
            </div>
          ) : events.items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Tidak ada kegiatan mendatang
            </div>
          ) : (
            events.items.map((event) => (
              <div key={event.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <FiCalendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {event.date}
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <FiClock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {event.time}
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <FiMapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {event.location}
          </div>
                    <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                  </div>
                  
                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                    {event.rsvpStatus ? (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        event.rsvpStatus === 'AKAN_HADIR' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.rsvpStatus === 'AKAN_HADIR' ? (
                          <>
                            <FiCheck className="mr-1.5 h-4 w-4" />
                            Akan Hadir
                          </>
                        ) : (
                          <>
                            <FiX className="mr-1.5 h-4 w-4" />
                            Tidak Hadir
                          </>
                        )}
                  </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRsvp(event.id, 'AKAN_HADIR')}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <FiCheck className="mr-1.5 -ml-0.5 h-4 w-4" />
                          Hadir
                        </button>
                        <button
                          onClick={() => handleRsvp(event.id, 'TIDAK_HADIR')}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <FiX className="mr-1.5 -ml-0.5 h-4 w-4" />
                          Tidak Hadir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        </div>

      {/* Announcements Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pengumuman</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {announcements.loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-sm text-gray-500">Memuat pengumuman...</p>
            </div>
          ) : announcements.error ? (
            <div className="p-6 text-center text-red-500">
              {announcements.error}
          </div>
          ) : announcements.items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Tidak ada pengumuman
                </div>
          ) : (
            announcements.items.map((announcement) => (
              <div key={announcement.id} className="p-6">
                <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                <div className="mt-1 text-sm text-gray-500">{announcement.date}</div>
                <p className="mt-2 text-sm text-gray-600">{announcement.content}</p>
                <div className="mt-2 text-sm text-gray-500">
                  Oleh: {announcement.author}
              </div>
              </div>
            ))
            )}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Aksi Cepat</h2>
        </div>
        
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/surat/buat" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <FiFileText className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">Ajukan Dokumen</span>
          </Link>
          
          <Link href="/dashboard/pengaduan/buat" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <FiAlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">Buat Pengaduan</span>
          </Link>
          
          <Link href="/dashboard/kegiatan" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <FiCalendar className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">Lihat Kegiatan</span>
          </Link>
          
          <Link href="/dashboard/forum" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <FiMessageSquare className="h-8 w-8 text-yellow-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">Forum Warga</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 