import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth';
import { notificationApi } from '../api';
import { Notification, NotificationFilter, NotificationResponse } from '../types/notification';
import { toast } from 'react-toastify';

export const useNotifications = (initialFilters: NotificationFilter = {}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState<NotificationFilter & { page?: number; limit?: number }>(
    { page: 1, limit: 10, ...initialFilters }
  );
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const result = await notificationApi.getAllNotifications(filters);
      setNotifications(result.notifications);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: number) => {
    if (!user) return;
    
    try {
      const success = await notificationApi.markAsRead(id);
      if (success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return success;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
      return false;
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      const success = await notificationApi.markAllAsRead();
      if (success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
      return success;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark all notifications as read');
      return false;
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (id: number) => {
    if (!user) return;
    
    try {
      const success = await notificationApi.deleteNotification(id);
      if (success) {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        // Update unread count if the deleted notification was unread
        const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      }
      return success;
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
      return false;
    }
  }, [user, notifications]);

  // Change page
  const changePage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: NotificationFilter) => {
    setFilters(prev => ({ 
      ...prev, 
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  }, []);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  // Set up polling for unread count and notifications
  useEffect(() => {
    if (!user) return;
    
    // Poll more frequently for better real-time experience
    const unreadCountInterval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Poll every 30 seconds for unread count
    
    // Poll notifications less frequently to avoid too many API calls
    const notificationsInterval = setInterval(() => {
      // Only refetch notifications if on first page to avoid disrupting pagination
      if (filters.page === 1) {
        fetchNotifications();
      }
    }, 120000); // Poll every 2 minutes for new notifications
    
    return () => {
      clearInterval(unreadCountInterval);
      clearInterval(notificationsInterval);
    };
  }, [user, fetchUnreadCount, fetchNotifications, filters.page]);

  // Parse notification data
  const parseNotificationData = useCallback((notification: Notification) => {
    // Since the backend already parses the data, just return it directly
    return notification.data || {};
  }, []);

  // Get role-based filtered notifications
  const getRoleBasedNotifications = useCallback(() => {
    if (!user) return [];
    
    return notifications.filter(notification => {
      switch (user.role) {
        case 'ADMIN':
          // Admin receives all notifications
          return true;
          
        case 'RW':
          // RW receives notifications from RT and warga in their wilayah
          // This would typically check against user's RW number
          // For now, show all relevant notification types
          return ['DOCUMENT', 'COMPLAINT', 'EVENT', 'SOCIAL_ASSISTANCE', 'FORUM', 'ANNOUNCEMENT', 'SYSTEM'].includes(notification.type);
          
        case 'RT':
          // RT receives notifications from warga in their wilayah
          switch (notification.type) {
            case 'DOCUMENT':
              return true; // Document verification requests from residents
            case 'COMPLAINT':
              return true; // Complaints from residents in RT area
            case 'SOCIAL_ASSISTANCE':
              return true; // Social assistance verification requests
            case 'SYSTEM':
              // Check if it's a resident verification notification
              const data = parseNotificationData(notification);
              return data.residentId != null;
            case 'EVENT':
              return true; // Events relevant to RT
            case 'ANNOUNCEMENT':
              return true; // Announcements from RW/Admin
            case 'FORUM':
              return true; // Forum posts in RT area
            default:
              return false;
          }
          
        case 'WARGA':
          // Warga only sees personal notifications or announcements for their area
          switch (notification.type) {
            case 'DOCUMENT':
              // Only their own document status updates
              const docData = parseNotificationData(notification);
              return docData.userId === user.id;
            case 'EVENT':
              return true; // Events in their area
            case 'ANNOUNCEMENT':
              return true; // General announcements
            case 'FORUM':
              return true; // Forum discussions
            case 'SOCIAL_ASSISTANCE':
              // Only notifications about their assistance applications
              const assistData = parseNotificationData(notification);
              return assistData.userId === user.id;
            case 'SYSTEM':
              // System notifications addressed to them
              return true;
            default:
              return false;
          }
          
        default:
          return false;
      }
    });
  }, [user, notifications, parseNotificationData]);
  
  // Get RT-specific notifications (for backward compatibility)
  const getRTNotifications = useCallback(() => {
    if (user?.role !== 'RT') return [];
    return getRoleBasedNotifications();
  }, [user, getRoleBasedNotifications]);

  return {
    notifications,
    rtNotifications: getRTNotifications(),
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
    updateFilters,
    parseNotificationData
  };
}; 