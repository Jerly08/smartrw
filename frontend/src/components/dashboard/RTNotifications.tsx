import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { NotificationType } from '@/lib/types/notification';
import { FiFileText, FiAlertCircle, FiCalendar, FiPackage, FiCheck, FiX, FiEye } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function RTNotifications() {
  const router = useRouter();
  const { notifications, loading, error, unreadCount, markAsRead } = useNotifications({ 
    limit: 5,
    isRead: false
  });
  
  // Handle notification click
  const handleNotificationClick = async (id: number, type: NotificationType, data: any) => {
    try {
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
          router.push('/dashboard/notifikasi');
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
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
      default:
        return <FiEye className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Gagal memuat notifikasi
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Notifikasi Terbaru</h3>
        {unreadCount > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            {unreadCount} baru
          </span>
        )}
      </div>
      
      {notifications.length > 0 ? (
        <div className="space-y-3">
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
                className="flex items-start p-3 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => handleNotificationClick(notification.id, notification.type, data)}
              >
                <div className="mr-3 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p>Tidak ada notifikasi baru</p>
        </div>
      )}
      
      {notifications.length > 0 && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => router.push('/dashboard/notifikasi')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Lihat Semua Notifikasi
          </button>
        </div>
      )}
    </div>
  );
} 