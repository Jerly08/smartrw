"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllReadNotifications = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUserNotifications = exports.createNotificationForRT = exports.createNotificationForUsers = exports.createNotification = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const prisma = new client_1.PrismaClient();
// Create a new notification
const createNotification = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if user exists
        const user = yield prisma.user.findUnique({
            where: { id: data.userId },
        });
        if (!user) {
            throw new error_middleware_1.ApiError('User not found', 404);
        }
        // Create notification
        const notification = yield prisma.notification.create({
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
    }
    catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
});
exports.createNotification = createNotification;
// Create notifications for multiple users
const createNotificationForUsers = (userIds, notificationData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = [];
        for (const userId of userIds) {
            const notification = yield (0, exports.createNotification)(Object.assign({ userId }, notificationData));
            notifications.push(notification);
        }
        return notifications;
    }
    catch (error) {
        console.error('Error creating notifications for users:', error);
        throw error;
    }
});
exports.createNotificationForUsers = createNotificationForUsers;
// Create notifications for users in specific RTs
const createNotificationForRT = (rtNumbers, notificationData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find all users in the specified RTs
        const residents = yield prisma.resident.findMany({
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
        return yield (0, exports.createNotificationForUsers)(userIds, notificationData);
    }
    catch (error) {
        console.error('Error creating notifications for RT:', error);
        throw error;
    }
});
exports.createNotificationForRT = createNotificationForRT;
// Get notifications for a user
const getUserNotifications = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, options = {}) {
    try {
        const { page = 1, limit = 10, isRead, type, includeExpired = false } = options;
        const skip = (page - 1) * limit;
        // Build where conditions
        const where = { userId };
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
        const total = yield prisma.notification.count({ where });
        // Get notifications
        const notifications = yield prisma.notification.findMany({
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
            }
            else if (notification.document) {
                sourceData = notification.document;
                sourceType = 'document';
            }
            else if (notification.complaint) {
                sourceData = notification.complaint;
                sourceType = 'complaint';
            }
            else if (notification.forumPost) {
                sourceData = notification.forumPost;
                sourceType = 'forumPost';
            }
            else if (notification.socialAssistance) {
                sourceData = notification.socialAssistance;
                sourceType = 'socialAssistance';
            }
            // Parse JSON data if exists
            let parsedData = null;
            if (notification.data) {
                try {
                    parsedData = JSON.parse(notification.data);
                }
                catch (e) {
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
    }
    catch (error) {
        console.error('Error getting user notifications:', error);
        throw error;
    }
});
exports.getUserNotifications = getUserNotifications;
// Mark notification as read
const markNotificationAsRead = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
        });
        if (!notification) {
            throw new error_middleware_1.ApiError('Notification not found', 404);
        }
        return yield prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
// Mark all notifications as read
const markAllNotificationsAsRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Delete notification
const deleteNotification = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
        });
        if (!notification) {
            throw new error_middleware_1.ApiError('Notification not found', 404);
        }
        return yield prisma.notification.delete({
            where: { id: notificationId },
        });
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
});
exports.deleteNotification = deleteNotification;
// Delete all read notifications
const deleteAllReadNotifications = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield prisma.notification.deleteMany({
            where: { userId, isRead: true },
        });
    }
    catch (error) {
        console.error('Error deleting read notifications:', error);
        throw error;
    }
});
exports.deleteAllReadNotifications = deleteAllReadNotifications;
// Get time ago string
const getTimeAgo = (date) => {
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
