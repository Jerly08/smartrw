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
exports.getRWUpcomingEvents = exports.getRWRecentDocuments = exports.getRWDashboardStats = exports.processDocumentRecommendation = exports.processVerification = exports.getRTUpcomingEvents = exports.getRTPendingDocuments = exports.getRTPendingVerifications = exports.getRTDashboardStats = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const prisma = new client_1.PrismaClient();
// Get RT dashboard statistics
const getRTDashboardStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get RT user's resident record to find their RT and RW numbers
        const rtUser = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
            },
        });
        if (!rtUser || !rtUser.resident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        const rtNumber = rtUser.resident.rtNumber;
        const rwNumber = rtUser.resident.rwNumber;
        // Get resident statistics for this RT
        const totalResidents = yield prisma.resident.count({
            where: {
                rtNumber,
                rwNumber,
            },
        });
        const verifiedResidents = yield prisma.resident.count({
            where: {
                rtNumber,
                rwNumber,
                isVerified: true,
            },
        });
        const totalFamilies = yield prisma.family.count({
            where: {
                rtNumber,
                rwNumber,
            },
        });
        // Get document statistics for this RT (pending documents that need RT approval)
        const pendingDocuments = yield prisma.document.count({
            where: {
                requester: {
                    resident: {
                        rtNumber,
                        rwNumber,
                    },
                },
                status: 'DIAJUKAN',
            },
        });
        const totalDocuments = yield prisma.document.count({
            where: {
                requester: {
                    resident: {
                        rtNumber,
                        rwNumber,
                    },
                },
            },
        });
        // Get complaint statistics for this RT
        const openComplaints = yield prisma.complaint.count({
            where: {
                creator: {
                    resident: {
                        rtNumber,
                        rwNumber,
                    },
                },
                status: 'DITERIMA',
            },
        });
        const totalComplaints = yield prisma.complaint.count({
            where: {
                creator: {
                    resident: {
                        rtNumber,
                        rwNumber,
                    },
                },
            },
        });
        // Get upcoming events for this RT
        const upcomingEvents = yield prisma.event.count({
            where: {
                OR: [
                    {
                        targetRTs: {
                            contains: rtNumber,
                        },
                    },
                    {
                        targetRTs: null, // Events for all RTs
                    },
                ],
                startDate: {
                    gte: new Date(),
                },
                isPublished: true,
            },
        });
        const stats = {
            rtNumber,
            rwNumber,
            residents: {
                total: totalResidents,
                verified: verifiedResidents,
                unverified: totalResidents - verifiedResidents,
                families: totalFamilies,
            },
            documents: {
                pending: pendingDocuments,
                total: totalDocuments,
            },
            complaints: {
                open: openComplaints,
                total: totalComplaints,
            },
            events: {
                upcoming: upcomingEvents,
            },
        };
        res.status(200).json({
            status: 'success',
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRTDashboardStats = getRTDashboardStats;
// Get pending verifications for RT
const getRTPendingVerifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { limit = '10', page = '1' } = req.query;
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        // Get RT user's resident record
        const rtUser = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
            },
        });
        if (!rtUser || !rtUser.resident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        const rtNumber = rtUser.resident.rtNumber;
        const rwNumber = rtUser.resident.rwNumber;
        // Get unverified residents in this RT
        const verifications = yield prisma.resident.findMany({
            where: {
                rtNumber,
                rwNumber,
                isVerified: false,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: {
                createdAt: 'desc',
            },
        });
        const totalVerifications = yield prisma.resident.count({
            where: {
                rtNumber,
                rwNumber,
                isVerified: false,
            },
        });
        // Format the response to match frontend expectations
        const formattedVerifications = verifications.map((resident) => ({
            id: resident.id,
            residentId: resident.id,
            name: resident.fullName,
            nik: resident.nik,
            address: resident.address,
            rtNumber: resident.rtNumber,
            rwNumber: resident.rwNumber,
            submittedAt: resident.createdAt.toISOString(),
        }));
        res.status(200).json({
            status: 'success',
            data: {
                verifications: formattedVerifications,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalVerifications,
                    totalPages: Math.ceil(totalVerifications / limitNum),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRTPendingVerifications = getRTPendingVerifications;
// Get pending documents for RT
const getRTPendingDocuments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { limit = '10', page = '1' } = req.query;
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        // Get RT user's resident record
        const rtUser = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
            },
        });
        if (!rtUser || !rtUser.resident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        const rtNumber = rtUser.resident.rtNumber;
        const rwNumber = rtUser.resident.rwNumber;
        // Get pending documents in this RT
        const documents = yield prisma.document.findMany({
            where: {
                requester: {
                    resident: {
                        rtNumber,
                        rwNumber,
                    },
                },
                status: 'DIAJUKAN',
            },
            include: {
                requester: {
                    select: {
                        name: true,
                        resident: {
                            select: {
                                fullName: true,
                                nik: true,
                            },
                        },
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: {
                createdAt: 'desc',
            },
        });
        const totalDocuments = yield prisma.document.count({
            where: {
                requester: {
                    resident: {
                        rtNumber,
                        rwNumber,
                    },
                },
                status: 'DIAJUKAN',
            },
        });
        // Format the response to match frontend expectations
        const formattedDocuments = documents.map((document) => {
            var _a, _b;
            return ({
                id: document.id,
                documentId: document.id,
                type: document.type,
                requester: ((_a = document.requester.resident) === null || _a === void 0 ? void 0 : _a.fullName) || document.requester.name,
                requesterNik: ((_b = document.requester.resident) === null || _b === void 0 ? void 0 : _b.nik) || 'N/A',
                subject: document.subject,
                submittedAt: document.createdAt.toISOString(),
            });
        });
        res.status(200).json({
            status: 'success',
            data: {
                documents: formattedDocuments,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalDocuments,
                    totalPages: Math.ceil(totalDocuments / limitNum),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRTPendingDocuments = getRTPendingDocuments;
// Get upcoming events for RT
const getRTUpcomingEvents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { limit = '10', page = '1' } = req.query;
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        // Get RT user's resident record
        const rtUser = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
            },
        });
        if (!rtUser || !rtUser.resident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        const rtNumber = rtUser.resident.rtNumber;
        // Get upcoming events for this RT
        const events = yield prisma.event.findMany({
            where: {
                OR: [
                    {
                        targetRTs: {
                            contains: rtNumber,
                        },
                    },
                    {
                        targetRTs: null, // Events for all RTs
                    },
                ],
                startDate: {
                    gte: new Date(),
                },
                isPublished: true,
            },
            include: {
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: {
                startDate: 'asc',
            },
        });
        const totalEvents = yield prisma.event.count({
            where: {
                OR: [
                    {
                        targetRTs: {
                            contains: rtNumber,
                        },
                    },
                    {
                        targetRTs: null,
                    },
                ],
                startDate: {
                    gte: new Date(),
                },
                isPublished: true,
            },
        });
        // Format the response to match frontend expectations
        const formattedEvents = events.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.startDate.toISOString(),
            location: event.location,
            participants: event._count.participants,
            isRTEvent: event.targetRTs !== null,
        }));
        res.status(200).json({
            status: 'success',
            data: {
                events: formattedEvents,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalEvents,
                    totalPages: Math.ceil(totalEvents / limitNum),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRTUpcomingEvents = getRTUpcomingEvents;
// Process resident verification
const processVerification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { id } = req.params;
        const { action, notes } = req.body;
        const residentId = parseInt(id);
        if (isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        if (!action || !['approve', 'reject'].includes(action)) {
            throw new error_middleware_1.ApiError('Invalid action', 400);
        }
        // Get the resident
        const resident = yield prisma.resident.findUnique({
            where: { id: residentId },
        });
        if (!resident) {
            throw new error_middleware_1.ApiError('Resident not found', 404);
        }
        // Get RT user's resident record to verify permissions
        const rtUser = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
            },
        });
        if (!rtUser || !rtUser.resident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        // Check if the resident belongs to this RT
        if (resident.rtNumber !== rtUser.resident.rtNumber || resident.rwNumber !== rtUser.resident.rwNumber) {
            throw new error_middleware_1.ApiError('You can only verify residents in your RT', 403);
        }
        if (action === 'approve') {
            // Approve the resident
            yield prisma.resident.update({
                where: { id: residentId },
                data: {
                    isVerified: true,
                    verifiedBy: req.user.name,
                    verifiedAt: new Date(),
                },
            });
        }
        else {
            // For rejection, you might want to add a notes field or handle differently
            // For now, we'll just leave them unverified
            console.log(`Resident ${residentId} verification rejected: ${notes}`);
        }
        res.status(200).json({
            status: 'success',
            message: `Resident verification ${action}d successfully`,
            data: { success: true },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.processVerification = processVerification;
// Process document recommendation
const processDocumentRecommendation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { id } = req.params;
        const { action, notes } = req.body;
        const documentId = parseInt(id);
        if (isNaN(documentId)) {
            throw new error_middleware_1.ApiError('Invalid document ID', 400);
        }
        if (!action || !['approve', 'reject'].includes(action)) {
            throw new error_middleware_1.ApiError('Invalid action', 400);
        }
        // Get the document
        const document = yield prisma.document.findUnique({
            where: { id: documentId },
            include: {
                requester: {
                    include: {
                        resident: true,
                    },
                },
            },
        });
        if (!document) {
            throw new error_middleware_1.ApiError('Document not found', 404);
        }
        // Get RT user's resident record to verify permissions
        const rtUser = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
            },
        });
        if (!rtUser || !rtUser.resident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        // Check if the document requester belongs to this RT
        if (!document.requester.resident ||
            document.requester.resident.rtNumber !== rtUser.resident.rtNumber ||
            document.requester.resident.rwNumber !== rtUser.resident.rwNumber) {
            throw new error_middleware_1.ApiError('You can only process documents from residents in your RT', 403);
        }
        if (action === 'approve') {
            // Approve the document (move to next status)
            yield prisma.document.update({
                where: { id: documentId },
                data: {
                    status: 'DIPROSES',
                    approvedBy: req.user.name,
                    approvedAt: new Date(),
                    rejectionReason: notes || null,
                },
            });
        }
        else {
            // Reject the document
            yield prisma.document.update({
                where: { id: documentId },
                data: {
                    status: 'DITOLAK',
                    rejectionReason: notes || 'Ditolak oleh RT',
                },
            });
        }
        res.status(200).json({
            status: 'success',
            message: `Document recommendation ${action}d successfully`,
            data: { success: true },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.processDocumentRecommendation = processDocumentRecommendation;
// Get RW dashboard statistics
const getRWDashboardStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get RW user's resident record to find their RW number
        const rwUser = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
            },
        });
        if (!rwUser || !rwUser.resident) {
            throw new error_middleware_1.ApiError('RW profile not found', 404);
        }
        const rwNumber = rwUser.resident.rwNumber;
        // Get resident statistics by RT for this RW
        const rtStats = yield prisma.resident.groupBy({
            by: ['rtNumber'],
            where: {
                rwNumber,
            },
            _count: {
                id: true,
            },
        });
        // Get verified residents count by RT
        const verifiedStats = yield prisma.resident.groupBy({
            by: ['rtNumber'],
            where: {
                rwNumber,
                isVerified: true,
            },
            _count: {
                id: true,
            },
        });
        // Combine the stats
        const byRT = rtStats.map(rt => {
            var _a;
            const verified = ((_a = verifiedStats.find(v => v.rtNumber === rt.rtNumber)) === null || _a === void 0 ? void 0 : _a._count.id) || 0;
            return {
                rtNumber: rt.rtNumber,
                count: rt._count.id,
                verified
            };
        });
        const totalResidents = rtStats.reduce((sum, rt) => sum + rt._count.id, 0);
        // Get document statistics
        const pendingDocuments = yield prisma.document.count({
            where: {
                requester: {
                    resident: {
                        rwNumber,
                    },
                },
                status: 'DIPROSES', // Documents that are processed by RT but pending RW approval
            },
        });
        const incomingDocuments = yield prisma.document.count({
            where: {
                requester: {
                    resident: {
                        rwNumber,
                    },
                },
                status: 'DIPROSES',
            },
        });
        const outgoingDocuments = yield prisma.document.count({
            where: {
                requester: {
                    resident: {
                        rwNumber,
                    },
                },
                status: 'SELESAI',
                createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // This month
                },
            },
        });
        // Get complaint statistics
        const totalComplaints = yield prisma.complaint.count({
            where: {
                creator: {
                    resident: {
                        rwNumber,
                    },
                },
            },
        });
        const openComplaints = yield prisma.complaint.count({
            where: {
                creator: {
                    resident: {
                        rwNumber,
                    },
                },
                status: 'DITERIMA',
            },
        });
        const inProgressComplaints = yield prisma.complaint.count({
            where: {
                creator: {
                    resident: {
                        rwNumber,
                    },
                },
                status: 'DITINDAKLANJUTI',
            },
        });
        const resolvedComplaints = yield prisma.complaint.count({
            where: {
                creator: {
                    resident: {
                        rwNumber,
                    },
                },
                status: 'SELESAI',
            },
        });
        // Get event statistics
        const upcomingEvents = yield prisma.event.count({
            where: {
                startDate: {
                    gte: new Date(),
                },
                isPublished: true,
                OR: [
                    { targetRTs: null }, // Events for all RTs
                    { targetRTs: { contains: rwNumber } }, // Events targeting this RW
                ],
            },
        });
        const totalEvents = yield prisma.event.count({
            where: {
                OR: [
                    { targetRTs: null },
                    { targetRTs: { contains: rwNumber } },
                ],
            },
        });
        // Get social assistance statistics
        const activeSocialAssistance = yield prisma.socialAssistance.count({
            where: {
                status: 'DISALURKAN',
            },
        });
        const totalRecipients = yield prisma.socialAssistanceRecipient.count({
            where: {
                resident: {
                    rwNumber,
                },
            },
        });
        const stats = {
            residents: {
                total: totalResidents,
                byRT,
            },
            documents: {
                incoming: incomingDocuments,
                outgoing: outgoingDocuments,
                pending: pendingDocuments,
            },
            complaints: {
                total: totalComplaints,
                open: openComplaints,
                inProgress: inProgressComplaints,
                resolved: resolvedComplaints,
            },
            events: {
                upcoming: upcomingEvents,
                total: totalEvents,
            },
            assistance: {
                active: activeSocialAssistance,
                recipients: totalRecipients,
            },
        };
        res.status(200).json({
            status: 'success',
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRWDashboardStats = getRWDashboardStats;
// Get recent documents for RW dashboard
const getRWRecentDocuments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { limit = '5' } = req.query;
        const limitNum = parseInt(limit);
        // Get RW user's resident record
        const rwUser = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resident: true,
            },
        });
        if (!rwUser || !rwUser.resident) {
            throw new error_middleware_1.ApiError('RW profile not found', 404);
        }
        const rwNumber = rwUser.resident.rwNumber;
        // Get recent documents from this RW area
        const documents = yield prisma.document.findMany({
            where: {
                requester: {
                    resident: {
                        rwNumber,
                    },
                },
                status: 'DIPROSES', // Documents pending RW approval
            },
            include: {
                requester: {
                    select: {
                        name: true,
                        resident: {
                            select: {
                                fullName: true,
                                rtNumber: true,
                            },
                        },
                    },
                },
            },
            take: limitNum,
            orderBy: {
                createdAt: 'desc',
            },
        });
        // Format the response
        const formattedDocuments = documents.map((document) => {
            var _a, _b;
            return ({
                id: document.id,
                type: document.type,
                requester: ((_a = document.requester.resident) === null || _a === void 0 ? void 0 : _a.fullName) || document.requester.name,
                rt: ((_b = document.requester.resident) === null || _b === void 0 ? void 0 : _b.rtNumber) || 'N/A',
                status: 'Menunggu',
                date: document.createdAt.toISOString(),
            });
        });
        res.status(200).json({
            status: 'success',
            data: formattedDocuments,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRWRecentDocuments = getRWRecentDocuments;
// Get upcoming events for RW dashboard
const getRWUpcomingEvents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { limit = '5' } = req.query;
        const limitNum = parseInt(limit);
        // Get upcoming events
        const events = yield prisma.event.findMany({
            where: {
                startDate: {
                    gte: new Date(),
                },
                isPublished: true,
            },
            include: {
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
            take: limitNum,
            orderBy: {
                startDate: 'asc',
            },
        });
        // Format the response
        const formattedEvents = events.map((event) => ({
            id: event.id,
            title: event.title,
            date: event.startDate.toISOString(),
            location: event.location || 'Lokasi tidak ditentukan',
            participants: event._count.participants,
        }));
        res.status(200).json({
            status: 'success',
            data: formattedEvents,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRWUpcomingEvents = getRWUpcomingEvents;
