import { PrismaClient, NotificationType, NotificationPriority } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

// Interface for creating notifications
interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  eventId?: number;
  documentId?: number;
  complaintId?: number;
  forumPostId?: number;
  socialAssistanceId?: number;
  data?: Record<string, any>;
  scheduledFor?: Date;
  expiresAt?: Date;
}

// Create a new notification
export const createNotification = async (data: CreateNotificationInput) => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      console.warn(`User ${data.userId} not found for notification`);
      return null; // Don't throw error, just skip creating notification
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'NORMAL',
        eventId: data.eventId,
        documentId: data.documentId,
        complaintId: data.complaintId,
        forumPostId: data.forumPostId,
        socialAssistanceId: data.socialAssistanceId,
        data: data.data ? JSON.stringify(data.data) : null,
        scheduledFor: data.scheduledFor,
        expiresAt: data.expiresAt,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error to prevent it from breaking the main process
    return null;
  }
};

// Create notifications for multiple users
export const createNotificationForUsers = async (
  userIds: number[],
  notificationData: Omit<CreateNotificationInput, 'userId'>
) => {
  try {
    const notifications = [];

    for (const userId of userIds) {
      const notification = await createNotification({
        userId,
        ...notificationData,
      });
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Error creating notifications for users:', error);
    throw error;
  }
};

// Create notifications for users in specific RTs
export const createNotificationForRT = async (
  rtNumbers: string[],
  notificationData: Omit<CreateNotificationInput, 'userId'>
) => {
  try {
    // Find all users in the specified RTs
    const residents = await prisma.resident.findMany({
      where: {
        rtNumber: {
          in: rtNumbers,
        },
      },
      select: {
        userId: true,
      },
    });

    const userIds = residents.map((resident) => resident.userId);
    return await createNotificationForUsers(userIds, notificationData);
  } catch (error) {
    console.error('Error creating notifications for RT:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (
  userId: number,
  options: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: NotificationType;
    includeExpired?: boolean;
  } = {}
) => {
  try {
    const { page = 1, limit = 10, isRead, type, includeExpired = false } = options;
    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = { userId };
    
    if (isRead !== undefined) {
      where.isRead = isRead;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (!includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.notification.count({ where });

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            category: true,
          },
        },
        document: {
          select: {
            id: true,
            type: true,
            subject: true,
            status: true,
          },
        },
        complaint: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        forumPost: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        socialAssistance: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Process notifications
    const processedNotifications = notifications.map((notification) => {
      let sourceData = null;
      let sourceType = null;

      if (notification.event) {
        sourceData = notification.event;
        sourceType = 'event';
      } else if (notification.document) {
        sourceData = notification.document;
        sourceType = 'document';
      } else if (notification.complaint) {
        sourceData = notification.complaint;
        sourceType = 'complaint';
      } else if (notification.forumPost) {
        sourceData = notification.forumPost;
        sourceType = 'forumPost';
      } else if (notification.socialAssistance) {
        sourceData = notification.socialAssistance;
        sourceType = 'socialAssistance';
      }

      // Parse JSON data if exists
      let parsedData = null;
      if (notification.data) {
        try {
          parsedData = JSON.parse(notification.data);
        } catch (e) {
          console.error('Error parsing notification data:', e);
        }
      }

      return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        priority: notification.priority,
        createdAt: notification.createdAt,
        scheduledFor: notification.scheduledFor,
        expiresAt: notification.expiresAt,
        sourceType,
        sourceData,
        data: parsedData,
        timeAgo: getTimeAgo(notification.createdAt),
      };
    });

    return {
      notifications: processedNotifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: number, userId: number) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new ApiError('Notification not found', 404);
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: number) => {
  try {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId: number, userId: number) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new ApiError('Notification not found', 404);
    }

    return await prisma.notification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all read notifications
export const deleteAllReadNotifications = async (userId: number) => {
  try {
    return await prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    throw error;
  }
};

// Get time ago string
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} detik yang lalu`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} menit yang lalu`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} jam yang lalu`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} hari yang lalu`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} bulan yang lalu`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} tahun yang lalu`;
}; 