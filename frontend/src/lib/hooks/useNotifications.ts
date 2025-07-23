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

  // Set up polling for unread count
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // Poll every minute
    
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Parse notification data
  const parseNotificationData = useCallback((notification: Notification) => {
    try {
      if (notification.data) {
        return JSON.parse(notification.data);
      }
    } catch (e) {
      console.error('Error parsing notification data:', e);
    }
    return {};
  }, []);

  // Get RT-specific notifications
  const getRTNotifications = useCallback(() => {
    if (user?.role !== 'RT') return [];
    
    return notifications.filter(notification => {
      // For RT users, filter to show only relevant notifications
      switch (notification.type) {
        case 'DOCUMENT':
          return true; // Document verification requests
        case 'COMPLAINT':
          return true; // Complaints from residents
        case 'SOCIAL_ASSISTANCE':
          return true; // Social assistance verification
        case 'SYSTEM':
          // Check if it's a resident verification notification
          const data = parseNotificationData(notification);
          return data.residentId != null;
        case 'EVENT':
          // Only events targeting this RT
          return true;
        default:
          return false;
      }
    });
  }, [user, notifications, parseNotificationData]);

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