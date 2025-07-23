import express from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Get notifications
router.get('/', notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread/count', notificationController.getUnreadNotificationCount);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllNotificationsAsRead);

// Delete all read notifications
router.delete('/read', notificationController.deleteAllReadNotifications);

// Mark notification as read
router.patch('/:id/read', notificationController.markNotificationAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

export default router; 