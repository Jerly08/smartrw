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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportEventParticipants = exports.getEventStatistics = exports.unpublishEvent = exports.publishEvent = exports.deleteEventPhoto = exports.addEventPhoto = exports.updateParticipantStatus = exports.getEventParticipants = exports.rsvpToEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.getAllEvents = void 0;
const eventService = __importStar(require("../services/event.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const client_2 = require("@prisma/client");
const prisma = new client_2.PrismaClient();
// Get all events
const getAllEvents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '10', search, category, startDate, endDate, isPublished, rtNumber, rwNumber } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        let parsedStartDate;
        let parsedEndDate;
        if (startDate && typeof startDate === 'string' && startDate.trim() !== '' && !isNaN(Date.parse(startDate))) {
            parsedStartDate = new Date(startDate);
        }
        if (endDate && typeof endDate === 'string' && endDate.trim() !== '' && !isNaN(Date.parse(endDate))) {
            parsedEndDate = new Date(endDate);
        }
        const result = yield eventService.getAllEvents({
            page: pageNum,
            limit: limitNum,
            search: search && search !== '' ? search : undefined,
            category: category && category !== '' ? category : undefined,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            rtNumber: rtNumber && rtNumber !== '' ? rtNumber : undefined,
            isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined
        });
        res.status(200).json({
            status: 'success',
            results: result.events.length,
            currentPage: pageNum,
            data: {
                events: result.events,
                pagination: result.pagination
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllEvents = getAllEvents;
// Get event by ID
const getEventById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            throw new error_middleware_1.ApiError('Invalid event ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const event = yield eventService.getEventById(eventId);
        res.status(200).json({
            status: 'success',
            data: {
                event,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getEventById = getEventById;
// Create event
const createEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Received createEvent body:", req.body); // DEBUG LOG
        console.log("Request headers:", req.headers); // DEBUG LOG
        console.log("Request content-type:", req.headers['content-type']); // DEBUG LOG
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { title, description, location, startDate, endDate, category, isPublished, targetRTs } = req.body;
        // Validate required fields
        if (!title || !description || !location || !startDate || !category) {
            throw new error_middleware_1.ApiError('Missing required fields', 400);
        }
        // Convert date strings to Date objects
        const startDateTime = new Date(startDate);
        if (isNaN(startDateTime.getTime())) {
            throw new error_middleware_1.ApiError('Invalid start date format', 400);
        }
        let endDateTime;
        if (endDate && endDate.trim() !== '') {
            endDateTime = new Date(endDate);
            if (isNaN(endDateTime.getTime())) {
                throw new error_middleware_1.ApiError('Invalid end date format', 400);
            }
            if (startDateTime >= endDateTime) {
                throw new error_middleware_1.ApiError('End date must be after start date', 400);
            }
        }
        // Process targetRTs - convert array to JSON string
        let targetRTsJson = undefined;
        if (targetRTs && Array.isArray(targetRTs) && targetRTs.length > 0) {
            targetRTsJson = JSON.stringify(targetRTs);
        }
        const eventData = {
            title,
            description,
            location,
            startDate: startDateTime,
            endDate: endDateTime,
            category,
            isPublished: Boolean(isPublished),
            targetRTs: targetRTsJson,
        };
        const newEvent = yield eventService.createEvent(eventData, req.user.id);
        res.status(201).json({
            status: 'success',
            message: 'Event created successfully',
            data: {
                event: newEvent,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createEvent = createEvent;
// Update event
const updateEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            throw new error_middleware_1.ApiError('Invalid event ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { title, description, location, startDate, endDate, category, isPublished, targetRTs } = req.body;
        const eventData = {};
        // Only include provided fields in the update data
        if (title !== undefined)
            eventData.title = title;
        if (description !== undefined)
            eventData.description = description;
        if (location !== undefined)
            eventData.location = location;
        if (category !== undefined)
            eventData.category = category;
        if (isPublished !== undefined)
            eventData.isPublished = Boolean(isPublished);
        // Process dates if provided
        if (startDate !== undefined) {
            const startDateTime = new Date(startDate);
            if (isNaN(startDateTime.getTime())) {
                throw new error_middleware_1.ApiError('Invalid start date format', 400);
            }
            eventData.startDate = startDateTime;
        }
        if (endDate !== undefined) {
            if (endDate === '' || endDate === null) {
                eventData.endDate = null;
            }
            else {
                const endDateTime = new Date(endDate);
                if (isNaN(endDateTime.getTime())) {
                    throw new error_middleware_1.ApiError('Invalid end date format', 400);
                }
                eventData.endDate = endDateTime;
            }
        }
        // Validate dates if both are provided
        if (eventData.startDate && eventData.endDate && eventData.startDate >= eventData.endDate) {
            throw new error_middleware_1.ApiError('End date must be after start date', 400);
        }
        // Process targetRTs if provided
        if (targetRTs !== undefined) {
            if (targetRTs === null || targetRTs === '') {
                eventData.targetRTs = undefined;
            }
            else if (Array.isArray(targetRTs)) {
                eventData.targetRTs = targetRTs.length > 0 ? JSON.stringify(targetRTs) : undefined;
            }
            else if (typeof targetRTs === 'string') {
                eventData.targetRTs = targetRTs;
            }
        }
        const updatedEvent = yield eventService.updateEvent(eventId, eventData, req.user.id);
        res.status(200).json({
            status: 'success',
            message: 'Event updated successfully',
            data: {
                event: updatedEvent,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateEvent = updateEvent;
// Delete event
const deleteEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            throw new error_middleware_1.ApiError('Invalid event ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        yield eventService.deleteEvent(eventId, req.user.id);
        res.status(200).json({
            status: 'success',
            message: 'Event deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteEvent = deleteEvent;
// RSVP to event
const rsvpToEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            throw new error_middleware_1.ApiError('Invalid event ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { status } = req.body;
        if (!status || !Object.values(client_1.RSVPStatus).includes(status)) {
            throw new error_middleware_1.ApiError('Invalid RSVP status', 400);
        }
        // Since rsvpToEvent doesn't exist in the service, we'll implement it directly here
        // First check if the event exists
        const event = yield prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new error_middleware_1.ApiError('Event not found', 404);
        }
        // Check if user has already RSVP'd
        const existingRSVP = yield prisma.eventParticipant.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: req.user.id,
                },
            },
        });
        let rsvp;
        if (existingRSVP) {
            // Update existing RSVP
            rsvp = yield prisma.eventParticipant.update({
                where: {
                    id: existingRSVP.id,
                },
                data: {
                    status,
                },
            });
        }
        else {
            // Create new RSVP
            rsvp = yield prisma.eventParticipant.create({
                data: {
                    eventId,
                    userId: req.user.id,
                    status,
                },
            });
        }
        res.status(200).json({
            status: 'success',
            message: 'RSVP updated successfully',
            data: {
                rsvp,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.rsvpToEvent = rsvpToEvent;
// Get event participants
const getEventParticipants = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            throw new error_middleware_1.ApiError('Invalid event ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Since getEventParticipants doesn't exist in the service, we'll implement it directly here
        // First check if the event exists
        const event = yield prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new error_middleware_1.ApiError('Event not found', 404);
        }
        // Get participants
        const participants = yield prisma.eventParticipant.findMany({
            where: {
                eventId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        resident: {
                            select: {
                                id: true,
                                fullName: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(200).json({
            status: 'success',
            data: {
                participants,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getEventParticipants = getEventParticipants;
// Update participant status
const updateParticipantStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);
        if (isNaN(eventId) || isNaN(userId)) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { status } = req.body;
        if (!status || !Object.values(client_1.RSVPStatus).includes(status)) {
            throw new error_middleware_1.ApiError('Invalid participant status', 400);
        }
        // Check if event exists
        const event = yield prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new error_middleware_1.ApiError('Event not found', 404);
        }
        // Check if user is authorized to update participant status
        if (event.createdBy !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
            throw new error_middleware_1.ApiError('You are not authorized to update participant status', 403);
        }
        // Check if participant exists
        const participant = yield prisma.eventParticipant.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId,
                },
            },
        });
        if (!participant) {
            throw new error_middleware_1.ApiError('Participant not found', 404);
        }
        // Update participant status
        const updatedParticipant = yield prisma.eventParticipant.update({
            where: {
                id: participant.id,
            },
            data: {
                status,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.status(200).json({
            status: 'success',
            message: 'Participant status updated successfully',
            data: {
                participant: updatedParticipant,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateParticipantStatus = updateParticipantStatus;
// Add event photo
const addEventPhoto = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            throw new error_middleware_1.ApiError('Invalid event ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Check if event exists
        const event = yield prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new error_middleware_1.ApiError('Event not found', 404);
        }
        // Check if user is authorized to add photos
        if (event.createdBy !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
            throw new error_middleware_1.ApiError('You are not authorized to add photos to this event', 403);
        }
        // Process uploaded files
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            throw new error_middleware_1.ApiError('No photos uploaded', 400);
        }
        const uploadDir = path_1.default.join(__dirname, '../../uploads/events');
        // Create upload directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        // Process each photo
        const photos = [];
        for (const file of req.files) {
            // Generate unique filename
            const fileName = `${(0, uuid_1.v4)()}-${file.originalname}`;
            const filePath = path_1.default.join(uploadDir, fileName);
            // Write file to disk
            yield fs_1.default.promises.writeFile(filePath, file.buffer);
            // Create photo record in database
            const photo = yield prisma.eventPhoto.create({
                data: {
                    eventId,
                    photoUrl: `/uploads/events/${fileName}`,
                    caption: null, // Set caption to null since we don't have it from the file
                },
            });
            photos.push(photo);
        }
        res.status(201).json({
            status: 'success',
            message: 'Photos uploaded successfully',
            data: {
                photos,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.addEventPhoto = addEventPhoto;
// Delete event photo
const deleteEventPhoto = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        const photoId = parseInt(req.params.photoId);
        if (isNaN(eventId) || isNaN(photoId)) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Check if event exists
        const event = yield prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new error_middleware_1.ApiError('Event not found', 404);
        }
        // Check if user is authorized to delete photos
        if (event.createdBy !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
            throw new error_middleware_1.ApiError('You are not authorized to delete photos from this event', 403);
        }
        // Check if photo exists and belongs to the event
        const photo = yield prisma.eventPhoto.findFirst({
            where: {
                id: photoId,
                eventId,
            },
        });
        if (!photo) {
            throw new error_middleware_1.ApiError('Photo not found', 404);
        }
        // Delete photo file from disk if it exists
        if (photo.photoUrl) {
            const filePath = path_1.default.join(__dirname, '../../', photo.photoUrl);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        // Delete photo from database
        yield prisma.eventPhoto.delete({
            where: {
                id: photoId,
            },
        });
        res.status(200).json({
            status: 'success',
            message: 'Photo deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteEventPhoto = deleteEventPhoto;
// Publish event
const publishEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            throw new error_middleware_1.ApiError('Invalid event ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const event = yield eventService.publishEvent(eventId, req.user.id);
        res.status(200).json({
            status: 'success',
            message: 'Event published successfully',
            data: {
                event,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.publishEvent = publishEvent;
// Unpublish event
const unpublishEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            throw new error_middleware_1.ApiError('Invalid event ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const event = yield eventService.unpublishEvent(eventId, req.user.id);
        res.status(200).json({
            status: 'success',
            message: 'Event unpublished successfully',
            data: {
                event,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.unpublishEvent = unpublishEvent;
// Get event statistics
const getEventStatistics = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get statistics directly from the database
        const total = yield prisma.event.count();
        const upcoming = yield prisma.event.count({
            where: {
                startDate: {
                    gte: new Date(),
                },
            },
        });
        const past = yield prisma.event.count({
            where: {
                endDate: {
                    lt: new Date(),
                },
            },
        });
        const published = yield prisma.event.count({
            where: {
                isPublished: true,
            },
        });
        const unpublished = yield prisma.event.count({
            where: {
                isPublished: false,
            },
        });
        const statistics = {
            total,
            upcoming,
            past,
            published,
            unpublished,
        };
        res.status(200).json({
            status: 'success',
            data: {
                statistics,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getEventStatistics = getEventStatistics;
// Export event participants to CSV
const exportEventParticipants = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            throw new error_middleware_1.ApiError('Invalid event ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get event details
        const event = yield prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                title: true,
                startDate: true,
                location: true,
            },
        });
        if (!event) {
            throw new error_middleware_1.ApiError('Event not found', 404);
        }
        // Get participants with user details
        const participants = yield prisma.eventParticipant.findMany({
            where: {
                eventId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        resident: {
                            select: {
                                fullName: true,
                                phoneNumber: true,
                                address: true,
                                rtNumber: true,
                                rwNumber: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        // Create CSV content
        const csvHeader = [
            'No',
            'Nama',
            'Email',
            'No. Telepon',
            'Alamat',
            'RT',
            'RW',
            'Status RSVP',
            'Tanggal Daftar',
        ].join(',');
        const csvRows = participants.map((participant, index) => {
            const user = participant.user;
            const resident = user === null || user === void 0 ? void 0 : user.resident;
            return [
                index + 1,
                `"${(user === null || user === void 0 ? void 0 : user.name) || (resident === null || resident === void 0 ? void 0 : resident.fullName) || 'N/A'}"`,
                `"${(user === null || user === void 0 ? void 0 : user.email) || 'N/A'}"`,
                `"${(resident === null || resident === void 0 ? void 0 : resident.phoneNumber) || 'N/A'}"`,
                `"${(resident === null || resident === void 0 ? void 0 : resident.address) || 'N/A'}"`,
                `"${(resident === null || resident === void 0 ? void 0 : resident.rtNumber) || 'N/A'}"`,
                `"${(resident === null || resident === void 0 ? void 0 : resident.rwNumber) || 'N/A'}"`,
                `"${participant.status}"`,
                `"${participant.createdAt.toLocaleDateString('id-ID')}"`,
            ].join(',');
        });
        const csvContent = [csvHeader, ...csvRows].join('\n');
        // Set headers for file download
        const fileName = `peserta-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        // Add BOM for proper UTF-8 encoding in Excel
        res.write('\uFEFF');
        res.end(csvContent);
    }
    catch (error) {
        next(error);
    }
});
exports.exportEventParticipants = exportEventParticipants;
