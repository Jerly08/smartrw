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
exports.getRTUpcomingEvents = exports.getRTPendingDocuments = exports.getRTPendingVerifications = exports.getRTDashboardStats = exports.getRTResidents = exports.getRTStatistics = exports.deleteRT = exports.updateRT = exports.createRT = exports.getRTByNumber = exports.getRTById = exports.getAllRTs = void 0;
const rtService = __importStar(require("../services/rt.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const rt_schema_1 = require("../schemas/rt.schema");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all RTs
const getAllRTs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '10', search, includeInactive = 'false' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const result = yield rtService.getAllRTs({
            page: pageNum,
            limit: limitNum,
            search: search,
            includeInactive: includeInactive === 'true',
        }, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            results: result.rts.length,
            totalPages: result.totalPages,
            currentPage: pageNum,
            totalItems: result.totalItems,
            data: {
                rts: result.rts,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllRTs = getAllRTs;
// Get RT by ID
const getRTById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rtId = parseInt(req.params.id);
        if (isNaN(rtId)) {
            throw new error_middleware_1.ApiError('Invalid RT ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const rt = yield rtService.getRTById(rtId, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            data: {
                rt,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRTById = getRTById;
// Get RT by number
const getRTByNumber = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { number } = req.params;
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const rt = yield rtService.getRTByNumber(number, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            data: {
                rt,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRTByNumber = getRTByNumber;
// Create RT
const createRT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate user
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Enhanced logging for debugging
        console.log('=== RT Creation Request ===');
        console.log('User:', {
            id: req.user.id,
            role: req.user.role,
            email: req.user.email
        });
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        // Detailed debugging for the "number" field
        const rawNumber = req.body.number;
        console.log('=== Number Field Analysis ===');
        console.log('Raw number field:', JSON.stringify(rawNumber));
        console.log('Type of number field:', typeof rawNumber);
        console.log('Length of number field:', rawNumber ? rawNumber.length : 'N/A');
        console.log('Number field character codes:', rawNumber ? Array.from(rawNumber).map((char) => char.charCodeAt(0)) : 'N/A');
        console.log('Number field after trim:', rawNumber ? JSON.stringify(rawNumber.trim()) : 'N/A');
        // Normalize the number field if it exists
        if (rawNumber && typeof rawNumber === 'string') {
            req.body.number = rawNumber.trim();
            console.log('Normalized number field:', JSON.stringify(req.body.number));
        }
        // Validate request body against schema
        let validatedData;
        try {
            validatedData = rt_schema_1.createRTSchema.parse(req.body);
            console.log('Validation successful:', JSON.stringify(validatedData, null, 2));
        }
        catch (validationError) {
            console.error('=== Validation Error Details ===');
            console.error('Validation failed:', validationError);
            if (validationError instanceof zod_1.ZodError) {
                console.error('Detailed Zod errors:');
                validationError.errors.forEach((err, index) => {
                    console.error(`Error ${index + 1}:`, {
                        path: err.path,
                        message: err.message,
                        code: err.code,
                        received: 'received' in err ? err.received : 'N/A',
                        expected: 'expected' in err ? err.expected : 'N/A'
                    });
                });
                const errors = validationError.errors.map(err => {
                    return `${err.path.join('.')}: ${err.message}`;
                });
                throw new error_middleware_1.ApiError(`Validation failed: ${errors.join(', ')}`, 400);
            }
            throw new error_middleware_1.ApiError('Invalid request data', 400);
        }
        const result = yield rtService.createRT(validatedData, req.user);
        console.log('RT Creation successful:', {
            rtId: result.rt.id,
            rtNumber: result.rt.number,
            credentials: {
                email: result.credentials.email,
                hasPassword: !!result.credentials.password
            }
        });
        res.status(201).json({
            status: 'success',
            message: 'RT created successfully',
            data: result,
        });
    }
    catch (error) {
        console.error('=== RT Creation Error ===');
        console.error('User:', req.user ? {
            id: req.user.id,
            role: req.user.role,
            email: req.user.email
        } : 'Not authenticated');
        console.error('Request body:', JSON.stringify(req.body, null, 2));
        // Type-safe error logging
        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                statusCode: error.statusCode || 500,
                stack: error.stack
            });
        }
        else {
            console.error('Unknown error:', error);
        }
        // Log Prisma-specific errors
        const prismaError = error;
        if (prismaError.code) {
            console.error('Prisma error code:', prismaError.code);
            console.error('Prisma error meta:', prismaError.meta);
        }
        // Log validation errors if they exist
        if (prismaError.errors && Array.isArray(prismaError.errors)) {
            console.error('Validation errors:', prismaError.errors);
        }
        next(error);
    }
});
exports.createRT = createRT;
// Update RT
const updateRT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rtId = parseInt(req.params.id);
        if (isNaN(rtId)) {
            throw new error_middleware_1.ApiError('Invalid RT ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        console.log('=== RT Update Request ===');
        console.log('RT ID:', rtId);
        console.log('User:', {
            id: req.user.id,
            role: req.user.role,
            email: req.user.email
        });
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        // Validate request body
        const validation = rt_schema_1.updateRTSchema.safeParse(req.body);
        if (!validation.success) {
            console.error('=== RT Update Validation Error ===');
            console.error('Validation errors:', validation.error.errors);
            console.error('Request body that failed validation:', JSON.stringify(req.body, null, 2));
            throw new error_middleware_1.ApiError(`Validation failed: ${validation.error.errors.map(err => `${err.path.join('.')} - ${err.message}`).join(', ')}`, 400);
        }
        // Sanitize null values to undefined to match service interface
        const sanitizedData = Object.fromEntries(Object.entries(validation.data).map(([key, value]) => [
            key,
            value === null ? undefined : value
        ]));
        console.log('Validated RT data:', JSON.stringify(validation.data, null, 2));
        console.log('Sanitized RT data:', JSON.stringify(sanitizedData, null, 2));
        const updatedRT = yield rtService.updateRT(rtId, sanitizedData, {
            id: req.user.id,
            role: req.user.role
        });
        console.log('RT updated successfully:', {
            rtId,
            updatedFields: Object.keys(sanitizedData),
            updatedBy: req.user.id
        });
        res.status(200).json({
            status: 'success',
            message: 'RT updated successfully',
            data: {
                rt: updatedRT,
            },
        });
    }
    catch (error) {
        console.error('=== RT Update Error ===');
        console.error('RT ID:', req.params.id);
        console.error('User:', req.user ? {
            id: req.user.id,
            role: req.user.role,
            email: req.user.email
        } : 'Not authenticated');
        console.error('Request body:', JSON.stringify(req.body, null, 2));
        // Type-safe error logging
        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                statusCode: error.statusCode || 500,
                stack: error.stack
            });
        }
        else {
            console.error('Unknown error:', error);
        }
        // Log Prisma-specific errors
        const prismaError = error;
        if (prismaError.code) {
            console.error('Prisma error code:', prismaError.code);
            console.error('Prisma error meta:', prismaError.meta);
        }
        // Log validation errors if they exist
        if (prismaError.errors && Array.isArray(prismaError.errors)) {
            console.error('Validation errors:', prismaError.errors);
        }
        next(error);
    }
});
exports.updateRT = updateRT;
// Delete RT
const deleteRT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rtId = parseInt(req.params.id);
        if (isNaN(rtId)) {
            throw new error_middleware_1.ApiError('Invalid RT ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        yield rtService.deleteRT(rtId, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            message: 'RT deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteRT = deleteRT;
// Get RT statistics
const getRTStatistics = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rtId = parseInt(req.params.id);
        if (isNaN(rtId)) {
            throw new error_middleware_1.ApiError('Invalid RT ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const statistics = yield rtService.getRTStatistics(rtId, {
            id: req.user.id,
            role: req.user.role
        });
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
exports.getRTStatistics = getRTStatistics;
// Get residents in RT
const getRTResidents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rtId = parseInt(req.params.id);
        const { page = '1', limit = '10', search } = req.query;
        if (isNaN(rtId)) {
            throw new error_middleware_1.ApiError('Invalid RT ID', 400);
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const result = yield rtService.getRTResidents(rtId, {
            page: pageNum,
            limit: limitNum,
            search: search,
        }, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            results: result.residents.length,
            totalPages: result.totalPages,
            currentPage: pageNum,
            totalItems: result.totalItems,
            data: {
                residents: result.residents,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRTResidents = getRTResidents;
// Get RT dashboard statistics for logged-in RT user
const getRTDashboardStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        if (req.user.role !== 'RT') {
            throw new error_middleware_1.ApiError('Access denied. Only RT users can access this endpoint', 403);
        }
        // Get RT user's data to determine their RT information
        const rtUserResident = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
                rt: true
            }
        });
        if (!(rtUserResident === null || rtUserResident === void 0 ? void 0 : rtUserResident.resident) && !(rtUserResident === null || rtUserResident === void 0 ? void 0 : rtUserResident.rt)) {
            throw new error_middleware_1.ApiError('RT user profile not found', 404);
        }
        // Get RT information
        let rtId = null;
        let rtNumber = null;
        if (rtUserResident.rt) {
            rtId = rtUserResident.rt.id;
            rtNumber = rtUserResident.rt.number;
        }
        else if (rtUserResident.resident) {
            rtNumber = rtUserResident.resident.rtNumber;
            // Find RT by number
            const rt = yield prisma.rT.findUnique({
                where: { number: rtNumber }
            });
            if (rt) {
                rtId = rt.id;
            }
        }
        if (!rtId || !rtNumber) {
            throw new error_middleware_1.ApiError('RT information not found', 404);
        }
        // Get RT statistics using existing service
        const statistics = yield rtService.getRTStatistics(rtId, {
            id: req.user.id,
            role: req.user.role
        });
        // Get pending documents count for this RT
        const pendingDocuments = yield prisma.document.count({
            where: {
                status: 'DIAJUKAN',
                requester: {
                    resident: {
                        rtNumber: rtNumber
                    }
                }
            }
        });
        // Get recent activity (documents submitted in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentDocuments = yield prisma.document.count({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                },
                requester: {
                    resident: {
                        rtNumber: rtNumber
                    }
                }
            }
        });
        // Get active complaints count
        const activeComplaints = yield prisma.complaint.count({
            where: {
                status: {
                    in: ['DITERIMA', 'DITINDAKLANJUTI']
                },
                creator: {
                    resident: {
                        rtNumber: rtNumber
                    }
                }
            }
        });
        // Prepare dashboard stats to match frontend expectations
        const dashboardStats = {
            rtNumber: rtNumber,
            rwNumber: statistics.rt.number || '01',
            residents: {
                total: statistics.totalResidents,
                verified: statistics.verifiedResidents,
                unverified: statistics.unverifiedResidents,
                families: statistics.totalFamilies
            },
            documents: {
                pending: pendingDocuments,
                total: recentDocuments
            },
            complaints: {
                open: activeComplaints,
                total: activeComplaints
            },
            events: {
                upcoming: 0 // Will be replaced with actual count later
            }
        };
        res.status(200).json({
            status: 'success',
            data: dashboardStats,
        });
    }
    catch (error) {
        console.error('Error fetching RT dashboard stats:', error);
        next(error);
    }
});
exports.getRTDashboardStats = getRTDashboardStats;
// Fetch pending verifications
const getRTPendingVerifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = parseInt(req.query.limit) || 5;
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        if (req.user.role !== 'RT') {
            throw new error_middleware_1.ApiError('Access denied. Only RT users can access this endpoint', 403);
        }
        // Get RT user's data to determine their RT information
        const rtUserResident = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
                rt: true
            }
        });
        if (!(rtUserResident === null || rtUserResident === void 0 ? void 0 : rtUserResident.resident) && !(rtUserResident === null || rtUserResident === void 0 ? void 0 : rtUserResident.rt)) {
            throw new error_middleware_1.ApiError('RT user profile not found', 404);
        }
        // Get RT information
        let rtNumber = null;
        if (rtUserResident.rt) {
            rtNumber = rtUserResident.rt.number;
        }
        else if (rtUserResident.resident) {
            rtNumber = rtUserResident.resident.rtNumber;
        }
        if (!rtNumber) {
            throw new error_middleware_1.ApiError('RT information not found', 404);
        }
        // Get pending verifications (residents that are not yet verified)
        const pendingVerifications = yield prisma.resident.findMany({
            where: {
                rtNumber: rtNumber,
                isVerified: false
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
        const formattedVerifications = pendingVerifications.map(resident => ({
            id: resident.id,
            residentId: resident.id,
            name: resident.user.name,
            nik: resident.nik,
            address: resident.address,
            rtNumber: resident.rtNumber,
            rwNumber: resident.rwNumber,
            submittedAt: resident.createdAt.toISOString(),
            photoUrl: undefined
        }));
        res.status(200).json({
            status: 'success',
            data: {
                verifications: formattedVerifications,
                pagination: {
                    page: 1,
                    limit: limit,
                    total: formattedVerifications.length,
                    totalPages: 1
                }
            },
        });
    }
    catch (error) {
        console.error('Error fetching pending verifications:', error);
        next(error);
    }
});
exports.getRTPendingVerifications = getRTPendingVerifications;
// Fetch pending documents
const getRTPendingDocuments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = parseInt(req.query.limit) || 5;
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        if (req.user.role !== 'RT') {
            throw new error_middleware_1.ApiError('Access denied. Only RT users can access this endpoint', 403);
        }
        // Get RT user's data to determine their RT information
        const rtUserResident = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
                rt: true
            }
        });
        if (!(rtUserResident === null || rtUserResident === void 0 ? void 0 : rtUserResident.resident) && !(rtUserResident === null || rtUserResident === void 0 ? void 0 : rtUserResident.rt)) {
            throw new error_middleware_1.ApiError('RT user profile not found', 404);
        }
        // Get RT information
        let rtNumber = null;
        if (rtUserResident.rt) {
            rtNumber = rtUserResident.rt.number;
        }
        else if (rtUserResident.resident) {
            rtNumber = rtUserResident.resident.rtNumber;
        }
        if (!rtNumber) {
            throw new error_middleware_1.ApiError('RT information not found', 404);
        }
        // Get pending documents for this RT
        const pendingDocuments = yield prisma.document.findMany({
            where: {
                status: 'DIAJUKAN',
                requester: {
                    resident: {
                        rtNumber: rtNumber
                    }
                }
            },
            include: {
                requester: {
                    select: {
                        name: true,
                        resident: {
                            select: {
                                nik: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
        const formattedDocuments = pendingDocuments.map(doc => {
            var _a;
            return ({
                id: doc.id,
                documentId: doc.id,
                type: doc.type,
                requester: doc.requester.name,
                requesterNik: ((_a = doc.requester.resident) === null || _a === void 0 ? void 0 : _a.nik) || '',
                subject: doc.subject || doc.type,
                submittedAt: doc.createdAt.toISOString()
            });
        });
        res.status(200).json({
            status: 'success',
            data: {
                documents: formattedDocuments,
                pagination: {
                    page: 1,
                    limit: limit,
                    total: formattedDocuments.length,
                    totalPages: 1
                }
            },
        });
    }
    catch (error) {
        console.error('Error fetching pending documents:', error);
        next(error);
    }
});
exports.getRTPendingDocuments = getRTPendingDocuments;
// Fetch upcoming events
const getRTUpcomingEvents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = parseInt(req.query.limit) || 5;
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        if (req.user.role !== 'RT') {
            throw new error_middleware_1.ApiError('Access denied. Only RT users can access this endpoint', 403);
        }
        // Get RT user's data to determine their RT information
        const rtUserResident = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
                rt: true
            }
        });
        if (!(rtUserResident === null || rtUserResident === void 0 ? void 0 : rtUserResident.resident) && !(rtUserResident === null || rtUserResident === void 0 ? void 0 : rtUserResident.rt)) {
            throw new error_middleware_1.ApiError('RT user profile not found', 404);
        }
        // Get RT information
        let rtNumber = null;
        if (rtUserResident.rt) {
            rtNumber = rtUserResident.rt.number;
        }
        else if (rtUserResident.resident) {
            rtNumber = rtUserResident.resident.rtNumber;
        }
        if (!rtNumber) {
            throw new error_middleware_1.ApiError('RT information not found', 404);
        }
        // Get upcoming events (events that start after today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = yield prisma.event.findMany({
            where: {
                startDate: {
                    gte: today
                },
                OR: [
                    {
                        targetRTs: {
                            contains: rtNumber
                        }
                    },
                    {
                        targetRTs: null // Global events
                    }
                ]
            },
            orderBy: {
                startDate: 'asc'
            },
            take: limit
        });
        const formattedEvents = upcomingEvents.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description || '',
            date: event.startDate.toISOString(),
            location: event.location || '',
            participants: 0,
            isRTEvent: event.targetRTs !== null
        }));
        res.status(200).json({
            status: 'success',
            data: {
                events: formattedEvents,
                pagination: {
                    page: 1,
                    limit: limit,
                    total: formattedEvents.length,
                    totalPages: 1
                }
            },
        });
    }
    catch (error) {
        console.error('Error fetching upcoming events:', error);
        next(error);
    }
});
exports.getRTUpcomingEvents = getRTUpcomingEvents;
