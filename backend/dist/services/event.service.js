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
exports.createEventNotifications = exports.unpublishEvent = exports.publishEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.getAllEvents = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const notificationService = __importStar(require("./notification.service"));
const prisma = new client_1.PrismaClient();
// Get all events with filtering
const getAllEvents = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (params = {}) {
    const { page = 1, limit = 10, search, category, startDate, endDate, isPublished, rtNumber } = params;
    const skip = (page - 1) * limit;
    // Build where conditions
    const where = {};
    if (search) {
        where.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
            { location: { contains: search } },
        ];
    }
    if (category) {
        where.category = category;
    }
    if (startDate) {
        where.startDate = { gte: startDate };
    }
    if (endDate) {
        where.endDate = { lte: endDate };
    }
    if (isPublished !== undefined) {
        where.isPublished = isPublished;
    }
    // Filter by RT if specified
    if (rtNumber) {
        where.targetRTs = { contains: rtNumber };
    }
    // Get total count for pagination
    const total = yield prisma.event.count({ where });
    // Get events
    const events = yield prisma.event.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
        include: {
            creator: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
            participants: {
                select: {
                    id: true,
                    status: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    participants: true,
                    photos: true,
                },
            },
        },
    });
    return {
        events,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getAllEvents = getAllEvents;
// Get event by ID
const getEventById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield prisma.event.findUnique({
        where: { id },
        include: {
            creator: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
            participants: {
                select: {
                    id: true,
                    status: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            photos: true,
        },
    });
    if (!event) {
        throw new error_middleware_1.ApiError('Event not found', 404);
    }
    return event;
});
exports.getEventById = getEventById;
// Create new event
const createEvent = (data, createdByUserId) => __awaiter(void 0, void 0, void 0, function* () {
    // Create event
    const event = yield prisma.event.create({
        data: Object.assign(Object.assign({}, data), { createdBy: createdByUserId }),
    });
    // Create notifications for the event if it's published
    yield (0, exports.createEventNotifications)(event, createdByUserId);
    return event;
});
exports.createEvent = createEvent;
// Update event
const updateEvent = (id, data, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if event exists
    const existingEvent = yield prisma.event.findUnique({
        where: { id },
    });
    if (!existingEvent) {
        throw new error_middleware_1.ApiError('Event not found', 404);
    }
    // Check if user is the creator or has permission
    if (existingEvent.createdBy !== userId) {
        throw new error_middleware_1.ApiError('You do not have permission to update this event', 403);
    }
    // Update event
    const updatedEvent = yield prisma.event.update({
        where: { id },
        data,
    });
    // Create notifications for the event if it's published or if publish status changed
    if (data.isPublished !== undefined && data.isPublished !== existingEvent.isPublished) {
        yield (0, exports.createEventNotifications)(updatedEvent, userId);
    }
    return updatedEvent;
});
exports.updateEvent = updateEvent;
// Delete event
const deleteEvent = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if event exists
    const event = yield prisma.event.findUnique({
        where: { id },
    });
    if (!event) {
        throw new error_middleware_1.ApiError('Event not found', 404);
    }
    // Check if user is the creator or has permission
    if (event.createdBy !== userId) {
        throw new error_middleware_1.ApiError('You do not have permission to delete this event', 403);
    }
    // Delete event
    yield prisma.event.delete({
        where: { id },
    });
    return true;
});
exports.deleteEvent = deleteEvent;
// Publish event
const publishEvent = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if event exists
    const event = yield prisma.event.findUnique({
        where: { id },
    });
    if (!event) {
        throw new error_middleware_1.ApiError('Event not found', 404);
    }
    // Check if user is the creator or has permission
    if (event.createdBy !== userId) {
        throw new error_middleware_1.ApiError('You do not have permission to publish this event', 403);
    }
    // Update event
    const updatedEvent = yield prisma.event.update({
        where: { id },
        data: { isPublished: true },
    });
    // Create notifications for the event
    yield (0, exports.createEventNotifications)(updatedEvent, userId);
    return updatedEvent;
});
exports.publishEvent = publishEvent;
// Unpublish event
const unpublishEvent = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if event exists
    const event = yield prisma.event.findUnique({
        where: { id },
    });
    if (!event) {
        throw new error_middleware_1.ApiError('Event not found', 404);
    }
    // Check if user is the creator or has permission
    if (event.createdBy !== userId) {
        throw new error_middleware_1.ApiError('You do not have permission to unpublish this event', 403);
    }
    // Update event
    const updatedEvent = yield prisma.event.update({
        where: { id },
        data: { isPublished: false },
    });
    return updatedEvent;
});
exports.unpublishEvent = unpublishEvent;
// Create event notifications
const createEventNotifications = (event, createdByUserId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the creator's role to determine notification scope
        const creator = yield prisma.user.findUnique({
            where: { id: createdByUserId },
            select: { role: true, resident: true },
        });
        if (!creator) {
            console.error('Creator not found for event notification');
            return;
        }
        // Parse targetRTs if it exists
        let targetRTNumbers = [];
        if (event.targetRTs) {
            try {
                targetRTNumbers = JSON.parse(event.targetRTs);
            }
            catch (e) {
                console.error('Error parsing targetRTs:', e);
            }
        }
        // If event is published, create notifications
        if (event.isPublished) {
            // For events created by ADMIN or RW, notify all users (including unverified warga)
            if (creator.role === 'ADMIN' || creator.role === 'RW') {
                // Get all users except the creator
                const allUsers = yield prisma.user.findMany({
                    where: {
                        id: { not: createdByUserId },
                        // Include all users regardless of verification status
                    },
                    select: { id: true },
                });
                const userIds = allUsers.map(user => user.id);
                yield notificationService.createNotificationForUsers(userIds, {
                    type: 'EVENT',
                    title: `Kegiatan ${event.category}`,
                    message: `${event.title} akan dilaksanakan pada ${new Date(event.startDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })} di ${event.location}`,
                    priority: 'HIGH', // High priority for RW/Admin events
                    eventId: event.id,
                    data: {
                        eventTitle: event.title,
                        eventDate: event.startDate,
                        eventLocation: event.location,
                        creatorRole: creator.role,
                    },
                    // Set expiration to event end date + 1 day, or 7 days from start if no end date
                    expiresAt: event.endDate
                        ? new Date(event.endDate.getTime() + 24 * 60 * 60 * 1000)
                        : new Date(event.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                });
            }
            // For events created by RT, notify users in specific RTs (including unverified)
            else if (creator.role === 'RT' && targetRTNumbers.length > 0) {
                // Get all users in the target RTs (including unverified)
                const residents = yield prisma.resident.findMany({
                    where: {
                        rtNumber: {
                            in: targetRTNumbers,
                        },
                        // Include both verified and unverified residents
                    },
                    select: {
                        userId: true,
                    },
                });
                // Also include users who registered but don't have resident profile yet
                const unregisteredUsers = yield prisma.user.findMany({
                    where: {
                        id: { not: createdByUserId },
                        resident: null, // Users without resident profile
                        role: 'WARGA',
                    },
                    select: { id: true },
                });
                const userIds = [...residents.map(r => r.userId), ...unregisteredUsers.map(u => u.id)];
                if (userIds.length > 0) {
                    yield notificationService.createNotificationForUsers(userIds, {
                        type: 'EVENT',
                        title: `Kegiatan RT ${targetRTNumbers.join(', ')}`,
                        message: `${event.title} akan dilaksanakan pada ${new Date(event.startDate).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })} di ${event.location}`,
                        priority: 'NORMAL',
                        eventId: event.id,
                        data: {
                            eventTitle: event.title,
                            eventDate: event.startDate,
                            eventLocation: event.location,
                            creatorRole: creator.role,
                            targetRTs: targetRTNumbers,
                        },
                        // Set expiration to event end date, or 7 days from start if no end date
                        expiresAt: event.endDate || new Date(event.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                    });
                }
            }
        }
    }
    catch (error) {
        console.error('Error creating event notifications:', error);
    }
});
exports.createEventNotifications = createEventNotifications;
