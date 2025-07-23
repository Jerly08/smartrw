'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { NotificationType, NotificationPriority } from '@/lib/types/notification';
import { 
  FiFileText, 
  FiCalendar, 
  FiAlertCircle, 
  FiMessageSquare, 
  FiPackage, 
  FiInfo, 
  FiCheck, 
  FiTrash2, 
  FiFilter, 
  FiRefreshCw,
  FiUser,
  FiUsers
} from 'react-icons/fi';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    notifications, 
    loading, 
    error, 
    unreadCount, 
    pagination, 
    filters,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    changePage,
    updateFilters
  } = useNotifications();

  const [selectedType, setSelectedType] = useState<NotificationType | ''>('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Apply filters
  const applyFilters = () => {
    updateFilters({
      type: selectedType as NotificationType || undefined,
      isRead: showUnreadOnly ? false : undefined
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedType('');
    setShowUnreadOnly(false);
    updateFilters({});
  };

  // Handle notification click to navigate
  const handleNotificationClick = async (id: number, type: NotificationType, data: any) => {
    // Mark notification as read
    await markAsRead(id);
    
    // Navigate based on notification type
    switch (type) {
      case 'DOCUMENT':
        router.push(`/dashboard/surat/${data?.documentId || ''}`);
        break;
      case 'COMPLAINT':
        router.push(`/dashboard/pengaduan/${data?.complaintId || ''}`);
        break;
      case 'EVENT':
        router.push(`/dashboard/kegiatan/${data?.eventId || ''}`);
        break;
      case 'SOCIAL_ASSISTANCE':
        router.push(`/dashboard/bantuan/${data?.assistanceId || ''}`);
        break;
      case 'SYSTEM':
        if (data?.residentId) {
          router.push(`/dashboard/warga/${data.residentId}`);
        }
        break;
      default:
        // Do nothing, just mark as read
        break;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'DOCUMENT':
        return <FiFileText className="h-5 w-5 text-blue-500" />;
      case 'COMPLAINT':
        return <FiAlertCircle className="h-5 w-5 text-red-500" />;
      case 'EVENT':
        return <FiCalendar className="h-5 w-5 text-purple-500" />;
      case 'SOCIAL_ASSISTANCE':
        return <FiPackage className="h-5 w-5 text-green-500" />;
      case 'FORUM':
        return <FiMessageSquare className="h-5 w-5 text-amber-500" />;
      case 'ANNOUNCEMENT':
        return <FiInfo className="h-5 w-5 text-blue-500" />;
      case 'SYSTEM':
        return <FiUser className="h-5 w-5 text-gray-500" />;
      default:
        return <FiInfo className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get priority badge color
  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'URGENT':
        return 'bg-red-200 text-red-900';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
    } catch (e) {
      return dateString;
    }
  };

  // Get RT-specific title based on user role
  const getPageTitle = () => {
    if (user?.role === 'RT') {
      return 'Notifikasi RT';
    } else if (user?.role === 'RW') {
      return 'Notifikasi RW';
    } else if (user?.role === 'ADMIN') {
      return 'Notifikasi Admin';
    } else {
      return 'Notifikasi';
    }
  };

  // Get notification description based on type for RT
  const getNotificationDescription = (notification: any, data: any) => {
    if (user?.role === 'RT') {
      switch (notification.type) {
        case 'DOCUMENT':
          return `Dokumen ${data?.documentType || ''} dari ${data?.requesterName || 'warga'} memerlukan verifikasi Anda`;
        case 'COMPLAINT':
          return `Pengaduan baru dari warga di RT Anda: ${notification.message}`;
        case 'SOCIAL_ASSISTANCE':
          return `Calon penerima bantuan ${data?.assistanceName || ''} memerlukan verifikasi Anda`;
        case 'SYSTEM':
          if (data?.residentId) {
            return `Warga baru ${data?.residentName || ''} memerlukan verifikasi Anda`;
          }
          return notification.message;
        default:
          return notification.message;
      }
    }
    return notification.message;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            disabled={unreadCount === 0}
          >
            <FiCheck className="mr-1" />
            <span>Tandai Semua Dibaca</span>
          </button>
          
          <button
            onClick={() => fetchNotifications()}
            className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <FiFilter className="mr-2 text-gray-500" />
            <span className="font-medium">Filter:</span>
          </div>
          
          <div className="flex-1">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as NotificationType | '')}
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Tipe</option>
              <option value="DOCUMENT">Dokumen</option>
              <option value="COMPLAINT">Pengaduan</option>
              <option value="EVENT">Kegiatan</option>
              <option value="SOCIAL_ASSISTANCE">Bantuan Sosial</option>
              <option value="FORUM">Forum</option>
              <option value="ANNOUNCEMENT">Pengumuman</option>
              <option value="SYSTEM">Sistem</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="unreadOnly"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="unreadOnly">Belum Dibaca Saja</label>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Terapkan
            </button>
            
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => fetchNotifications()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-800 rounded-lg p-8 text-center">
          <FiInfo className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">Tidak Ada Notifikasi</h3>
          <p className="text-gray-600 mt-2">Belum ada notifikasi yang sesuai dengan filter yang dipilih</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            // Parse JSON data if it exists
            let data = {};
            try {
              if (notification.data) {
                data = JSON.parse(notification.data);
              }
            } catch (e) {
              console.error('Error parsing notification data:', e);
            }
            
            return (
              <div 
                key={notification.id}
                className={`flex items-start p-4 border-l-4 ${notification.isRead ? 'border-gray-300 bg-white' : 'border-blue-500 bg-blue-50'} shadow rounded-lg cursor-pointer hover:bg-gray-50 transition-colors`}
                onClick={() => handleNotificationClick(notification.id, notification.type, data)}
              >
                <div className="mr-4">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{notification.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mt-1">
                    {getNotificationDescription(notification, data)}
                  </p>
                  
                  {/* Show action buttons for RT notifications */}
                  {user?.role === 'RT' && (
                    <div className="mt-3 flex space-x-2">
                      {notification.type === 'DOCUMENT' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/surat/${(data as any)?.documentId || ''}`);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                        >
                          Verifikasi Dokumen
                        </button>
                      )}
                      
                      {notification.type === 'SOCIAL_ASSISTANCE' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/bantuan/${(data as any)?.assistanceId || ''}`);
                          }}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                        >
                          Verifikasi Bantuan
                        </button>
                      )}
                      
                      {notification.type === 'SYSTEM' && (data as any)?.residentId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/warga/${(data as any)?.residentId || ''}`);
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                        >
                          Verifikasi Warga
                        </button>
                      )}
                      
                      {notification.type === 'COMPLAINT' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/pengaduan/${(data as any)?.complaintId || ''}`);
                          }}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                        >
                          Tanggapi Pengaduan
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-1">
            <button
              onClick={() => changePage(1)}
              disabled={pagination.page === 1}
              className={`px-3 py-1 rounded-md ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              First
            </button>
            
            <button
              onClick={() => changePage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-3 py-1 rounded-md ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Prev
            </button>
            
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => changePage(i + 1)}
                className={`px-3 py-1 rounded-md ${
                  pagination.page === i + 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => changePage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 py-1 rounded-md ${
                pagination.page === pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Next
            </button>
            
            <button
              onClick={() => changePage(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 py-1 rounded-md ${
                pagination.page === pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 