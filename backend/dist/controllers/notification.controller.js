"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.deleteAllReadNotifications = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUnreadNotificationCount = exports.getUserNotifications = void 0;
const notificationService = __importStar(require("../services/notification.service"));
const error_middleware_1 = require("../middleware/error.middleware");
// Get notifications for the authenticated user
const getUserNotifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const userId = req.user.id;
        const { page, limit, isRead, type, includeExpired } = req.query;
        const options = {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
            type: type,
            includeExpired: includeExpired === 'true',
        };
        const result = yield notificationService.getUserNotifications(userId, options);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserNotifications = getUserNotifications;
// Get unread notification count
const getUnreadNotificationCount = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const userId = req.user.id;
        const result = yield notificationService.getUserNotifications(userId, { isRead: false });
        res.status(200).json({
            status: 'success',
            data: {
                count: result.pagination.total,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getUnreadNotificationCount = getUnreadNotificationCount;
// Mark notification as read
const markNotificationAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id, 10);
        yield notificationService.markNotificationAsRead(notificationId, userId);
        res.status(200).json({
            status: 'success',
            message: 'Notification marked as read',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
// Mark all notifications as read
const markAllNotificationsAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const userId = req.user.id;
        yield notificationService.markAllNotificationsAsRead(userId);
        res.status(200).json({
            status: 'success',
            message: 'All notifications marked as read',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Delete notification
const deleteNotification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id, 10);
        yield notificationService.deleteNotification(notificationId, userId);
        res.status(200).json({
            status: 'success',
            message: 'Notification deleted',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteNotification = deleteNotification;
// Delete all read notifications
const deleteAllReadNotifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const userId = req.user.id;
        yield notificationService.deleteAllReadNotifications(userId);
        res.status(200).json({
            status: 'success',
            message: 'All read notifications deleted',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteAllReadNotifications = deleteAllReadNotifications;
