import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';
import { ApiError } from '../middleware/error.middleware';

// Get notifications for the authenticated user
export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const userId = req.user.id;
    const { page, limit, isRead, type, includeExpired } = req.query;

    const options = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type: type as any,
      includeExpired: includeExpired === 'true',
    };

    const result = await notificationService.getUserNotifications(userId, options);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const userId = req.user.id;
    
    const result = await notificationService.getUserNotifications(userId, { isRead: false });
    
    res.status(200).json({
      status: 'success',
      data: {
        count: result.pagination.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const userId = req.user.id;
    const notificationId = parseInt(req.params.id, 10);

    await notificationService.markNotificationAsRead(notificationId, userId);

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const userId = req.user.id;

    await notificationService.markAllNotificationsAsRead(userId);

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const userId = req.user.id;
    const notificationId = parseInt(req.params.id, 10);

    await notificationService.deleteNotification(notificationId, userId);

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Delete all read notifications
export const deleteAllReadNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const userId = req.user.id;

    await notificationService.deleteAllReadNotifications(userId);

    res.status(200).json({
      status: 'success',
      message: 'All read notifications deleted',
    });
  } catch (error) {
    next(error);
  }
}; 