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
exports.getComplaintStatistics = exports.respondToComplaint = exports.deleteComplaint = exports.updateComplaint = exports.createComplaint = exports.getComplaintById = exports.getAllComplaints = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const helpers_1 = require("../utils/helpers");
const prisma = new client_1.PrismaClient();
// Get all complaints with pagination and filtering
const getAllComplaints = (params, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, search, category, status, startDate, endDate, rtNumber, rwNumber } = params;
    // Calculate pagination
    const skip = (page - 1) * limit;
    // Build where conditions
    const whereConditions = {};
    if (search) {
        whereConditions.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
            { location: { contains: search } },
        ];
    }
    if (category) {
        whereConditions.category = category;
    }
    if (status) {
        whereConditions.status = status;
    }
    if (startDate) {
        whereConditions.createdAt = Object.assign(Object.assign({}, (whereConditions.createdAt || {})), { gte: startDate });
    }
    if (endDate) {
        whereConditions.createdAt = Object.assign(Object.assign({}, (whereConditions.createdAt || {})), { lte: endDate });
    }
    // Apply role-based filtering
    if (currentUser.role === 'RT') {
        // RT can only see complaints from their RT
        const rtUser = yield prisma.user.findUnique({
            where: { id: currentUser.id },
            include: {
                resident: true,
                rt: true
            }
        });
        if (!rtUser) {
            throw new error_middleware_1.ApiError('RT user not found', 404);
        }
        let rtNumber = null;
        let rwNumber = null;
        // Get RT information from either RT profile or resident profile
        if (rtUser.rt) {
            rtNumber = rtUser.rt.number;
            // Get RW number from RT's area (assuming RT knows its RW)
            const rtInfo = yield prisma.rT.findUnique({
                where: { id: rtUser.rt.id },
                select: { number: true }
            });
            if (rtInfo) {
                rtNumber = rtInfo.number;
                // Extract RW number from RT number (assuming format like "001" where RW is first digit)
                rwNumber = '01'; // You might need to adjust this based on your data structure
            }
        }
        else if (rtUser.resident) {
            rtNumber = rtUser.resident.rtNumber;
            rwNumber = rtUser.resident.rwNumber;
        }
        if (!rtNumber) {
            throw new error_middleware_1.ApiError('RT information not found', 404);
        }
        // Get all users (warga) from the RT's area
        const rtResidents = yield prisma.resident.findMany({
            where: Object.assign({ rtNumber: rtNumber }, (rwNumber && { rwNumber: rwNumber })),
            select: { userId: true },
        });
        const rtUserIds = rtResidents.map(resident => resident.userId);
        // Filter complaints by RT's residents only
        whereConditions.createdBy = { in: rtUserIds };
        // If rtNumber is specified in query, it must match the RT's rtNumber
        if (params.rtNumber && params.rtNumber !== rtNumber) {
            throw new error_middleware_1.ApiError('RT can only access complaints for their own RT', 403);
        }
        // If rwNumber is specified in query, it must match the RT's rwNumber
        if (params.rwNumber && rwNumber && params.rwNumber !== rwNumber) {
            throw new error_middleware_1.ApiError('RT can only access complaints for their own RW', 403);
        }
    }
    else if (currentUser.role === 'RW') {
        // RW can see complaints from all RTs under their RW
        const rwUser = yield prisma.user.findUnique({
            where: { id: currentUser.id },
            include: {
                resident: true
            }
        });
        if (!(rwUser === null || rwUser === void 0 ? void 0 : rwUser.resident)) {
            throw new error_middleware_1.ApiError('RW user profile not found', 404);
        }
        const rwNumber = rwUser.resident.rwNumber;
        // Get all residents from the RW's area (all RTs under this RW)
        const rwResidents = yield prisma.resident.findMany({
            where: {
                rwNumber: rwNumber
            },
            select: { userId: true },
        });
        const rwUserIds = rwResidents.map(resident => resident.userId);
        // Filter complaints by RW's residents (from all RTs under this RW)
        whereConditions.createdBy = { in: rwUserIds };
        // Apply additional filters if provided
        if (params.rtNumber) {
            // RW can filter by specific RT under their RW
            const rtResidents = yield prisma.resident.findMany({
                where: {
                    rtNumber: params.rtNumber,
                    rwNumber: rwNumber // Ensure RT is under this RW
                },
                select: { userId: true },
            });
            if (rtResidents.length === 0) {
                throw new error_middleware_1.ApiError('RT not found under your RW', 403);
            }
            const rtUserIds = rtResidents.map(resident => resident.userId);
            whereConditions.createdBy = { in: rtUserIds };
        }
    }
    else if (currentUser.role === 'WARGA') {
        // Warga can only see their own complaints
        whereConditions.createdBy = currentUser.id;
        // Ignore rtNumber and rwNumber filters for Warga
    }
    else if (currentUser.role === 'ADMIN') {
        // Admin can see all complaints
        // Apply optional filters if provided
        if (params.rtNumber || params.rwNumber) {
            // Get all users from the specified RT/RW
            const residentsQuery = {};
            if (params.rtNumber) {
                residentsQuery.rtNumber = params.rtNumber;
            }
            if (params.rwNumber) {
                residentsQuery.rwNumber = params.rwNumber;
            }
            const residents = yield prisma.resident.findMany({
                where: residentsQuery,
                select: { userId: true },
            });
            const userIds = residents.map(resident => resident.userId);
            // Filter complaints by users in the specified RT/RW
            whereConditions.createdBy = { in: userIds };
        }
    }
    // Get complaints with pagination
    const complaints = yield prisma.complaint.findMany({
        where: whereConditions,
        include: {
            creator: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    resident: {
                        select: {
                            rtNumber: true,
                            rwNumber: true,
                            fullName: true,
                        },
                    },
                },
            },
        },
        skip,
        take: limit,
        orderBy: {
            createdAt: 'desc',
        },
    });
    // Get total count for pagination
    const totalItems = yield prisma.complaint.count({
        where: whereConditions,
    });
    return {
        complaints,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
    };
});
exports.getAllComplaints = getAllComplaints;
// Get complaint by ID
const getComplaintById = (id, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if complaint exists
    const complaint = yield prisma.complaint.findUnique({
        where: { id },
        include: {
            creator: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    resident: {
                        select: {
                            rtNumber: true,
                            rwNumber: true,
                            fullName: true,
                        },
                    },
                },
            },
        },
    });
    if (!complaint) {
        throw new error_middleware_1.ApiError('Complaint not found', 404);
    }
    // Check if user has permission to view this complaint
    const canAccess = yield canAccessComplaint(id, currentUser);
    if (!canAccess) {
        throw new error_middleware_1.ApiError('You do not have permission to view this complaint', 403);
    }
    return complaint;
});
exports.getComplaintById = getComplaintById;
// Create complaint
const createComplaint = (data, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has resident data for non-admin roles
    if (currentUser.role !== 'ADMIN') {
        const requester = yield prisma.user.findUnique({
            where: { id: currentUser.id },
            include: {
                resident: true,
            },
        });
        if (!requester) {
            throw new error_middleware_1.ApiError('User not found', 404);
        }
        if (!requester.resident) {
            throw new error_middleware_1.ApiError('User must have resident profile to create complaint', 400);
        }
    }
    // Set the creator ID to the current user
    const complaintData = Object.assign(Object.assign({}, data), { createdBy: currentUser.id, status: 'DITERIMA' });
    // Create complaint
    const complaint = yield prisma.complaint.create({
        data: complaintData,
        include: {
            creator: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
        },
    });
    // Create notification for RT and RW
    try {
        yield createComplaintNotifications(complaint);
    }
    catch (error) {
        console.error('Error creating complaint notifications:', error);
        // Don't fail the complaint creation if notification fails
    }
    return complaint;
});
exports.createComplaint = createComplaint;
// Update complaint
const updateComplaint = (id, data, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if complaint exists
    const existingComplaint = yield prisma.complaint.findUnique({
        where: { id },
    });
    if (!existingComplaint) {
        throw new error_middleware_1.ApiError('Complaint not found', 404);
    }
    // Check if user has permission to update this complaint
    const canUpdate = yield canUpdateComplaint(id, currentUser);
    if (!canUpdate) {
        throw new error_middleware_1.ApiError('You do not have permission to update this complaint', 403);
    }
    // Warga can only update their own complaints if they are still in DITERIMA status
    if (currentUser.role === 'WARGA' && existingComplaint.status !== 'DITERIMA') {
        throw new error_middleware_1.ApiError('You cannot update a complaint that is already being processed', 403);
    }
    // Update complaint
    const updatedComplaint = yield prisma.complaint.update({
        where: { id },
        data: data,
        include: {
            creator: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
        },
    });
    return updatedComplaint;
});
exports.updateComplaint = updateComplaint;
// Delete complaint
const deleteComplaint = (id, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if complaint exists
    const existingComplaint = yield prisma.complaint.findUnique({
        where: { id },
    });
    if (!existingComplaint) {
        throw new error_middleware_1.ApiError('Complaint not found', 404);
    }
    // Check if user has permission to delete this complaint
    const canDelete = yield canDeleteComplaint(id, currentUser);
    if (!canDelete) {
        throw new error_middleware_1.ApiError('You do not have permission to delete this complaint', 403);
    }
    // Delete complaint
    yield prisma.complaint.delete({
        where: { id },
    });
    return true;
});
exports.deleteComplaint = deleteComplaint;
// Respond to complaint
const respondToComplaint = (id, response, status, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if complaint exists
    const existingComplaint = yield prisma.complaint.findUnique({
        where: { id },
    });
    if (!existingComplaint) {
        throw new error_middleware_1.ApiError('Complaint not found', 404);
    }
    // Check if user has permission to respond to this complaint
    const canRespond = yield canRespondToComplaint(id, currentUser);
    if (!canRespond) {
        throw new error_middleware_1.ApiError('You do not have permission to respond to this complaint', 403);
    }
    // Get the responder's name
    const responderName = currentUser.name || `User ${currentUser.id}`;
    // Update complaint with response
    const updatedComplaint = yield prisma.complaint.update({
        where: { id },
        data: {
            response,
            status,
            respondedBy: responderName,
            respondedAt: new Date(),
        },
        include: {
            creator: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
        },
    });
    // Create notification for the complaint creator
    yield createResponseNotification(updatedComplaint);
    return updatedComplaint;
});
exports.respondToComplaint = respondToComplaint;
// Get complaint statistics
const getComplaintStatistics = (currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    let whereConditions = {};
    // Apply role-based filtering
    if (currentUser.role === 'RT') {
        // RT can only see statistics for their RT
        const rtUser = yield prisma.user.findUnique({
            where: { id: currentUser.id },
            include: {
                resident: true,
                rt: true
            }
        });
        if (!rtUser) {
            throw new error_middleware_1.ApiError('RT user not found', 404);
        }
        let rtNumber = null;
        let rwNumber = null;
        // Get RT information from either RT profile or resident profile
        if (rtUser.rt) {
            rtNumber = rtUser.rt.number;
            rwNumber = '01'; // You might need to adjust this based on your data structure
        }
        else if (rtUser.resident) {
            rtNumber = rtUser.resident.rtNumber;
            rwNumber = rtUser.resident.rwNumber;
        }
        if (!rtNumber) {
            throw new error_middleware_1.ApiError('RT information not found', 404);
        }
        // Get all users from the RT's area
        const rtUsers = yield prisma.resident.findMany({
            where: Object.assign({ rtNumber: rtNumber }, (rwNumber && { rwNumber: rwNumber })),
            select: { userId: true },
        });
        const rtUserIds = rtUsers.map(user => user.userId);
        // Filter complaints by RT's users
        whereConditions.createdBy = { in: rtUserIds };
    }
    else if (currentUser.role === 'RW') {
        // RW can see statistics from all RTs under their RW
        const rwUser = yield prisma.user.findUnique({
            where: { id: currentUser.id },
            include: {
                resident: true
            }
        });
        if (!(rwUser === null || rwUser === void 0 ? void 0 : rwUser.resident)) {
            throw new error_middleware_1.ApiError('RW user profile not found', 404);
        }
        const rwNumber = rwUser.resident.rwNumber;
        // Get all residents from the RW's area (all RTs under this RW)
        const rwResidents = yield prisma.resident.findMany({
            where: {
                rwNumber: rwNumber
            },
            select: { userId: true },
        });
        const rwUserIds = rwResidents.map(resident => resident.userId);
        // Filter complaints by RW's residents (from all RTs under this RW)
        whereConditions.createdBy = { in: rwUserIds };
    }
    else if (currentUser.role === 'WARGA') {
        // Warga can only see statistics for their own complaints
        whereConditions.createdBy = currentUser.id;
    }
    // Admin can see all statistics
    // Get total complaints
    const totalComplaints = yield prisma.complaint.count({
        where: whereConditions,
    });
    // Get complaints by status
    const [diterima, ditindaklanjuti, selesai, ditolak] = yield Promise.all([
        prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { status: 'DITERIMA' }),
        }),
        prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { status: 'DITINDAKLANJUTI' }),
        }),
        prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { status: 'SELESAI' }),
        }),
        prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { status: 'DITOLAK' }),
        }),
    ]);
    // Get complaints by category
    const [lingkungan, keamanan, sosial, infrastruktur, administrasi, lainnya] = yield Promise.all([
        prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { category: 'LINGKUNGAN' }),
        }),
        prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { category: 'KEAMANAN' }),
        }),
        prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { category: 'SOSIAL' }),
        }),
        prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { category: 'INFRASTRUKTUR' }),
        }),
        prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { category: 'ADMINISTRASI' }),
        }),
        prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { category: 'LAINNYA' }),
        }),
    ]);
    // Get monthly data for the last 6 months
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const count = yield prisma.complaint.count({
            where: Object.assign(Object.assign({}, whereConditions), { createdAt: {
                    gte: month,
                    lte: nextMonth,
                } }),
        });
        monthlyData.push({
            month: month.toLocaleString('default', { month: 'long' }),
            year: month.getFullYear(),
            count,
        });
    }
    return {
        totalComplaints,
        byStatus: {
            diterima,
            ditindaklanjuti,
            selesai,
            ditolak,
        },
        byCategory: {
            lingkungan,
            keamanan,
            sosial,
            infrastruktur,
            administrasi,
            lainnya,
        },
        monthlyDistribution: monthlyData,
    };
});
exports.getComplaintStatistics = getComplaintStatistics;
// Helper function to check if a user can access a specific complaint
function canAccessComplaint(complaintId, currentUser) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        // Admin and RW can access all complaints
        if ((0, helpers_1.hasPermission)(currentUser.role, 'RW')) {
            return true;
        }
        const complaint = yield prisma.complaint.findUnique({
            where: { id: complaintId },
            include: {
                creator: {
                    include: {
                        resident: true,
                    },
                },
            },
        });
        if (!complaint) {
            return false;
        }
        // Creator can always access their own complaints
        if (complaint.createdBy === currentUser.id) {
            return true;
        }
        // RT can access complaints from their RT
        if (currentUser.role === 'RT') {
            const rtResident = yield prisma.resident.findFirst({
                where: { userId: currentUser.id },
            });
            if (!rtResident) {
                return false;
            }
            // Check if complaint creator is from RT's area
            if (((_b = (_a = complaint.creator) === null || _a === void 0 ? void 0 : _a.resident) === null || _b === void 0 ? void 0 : _b.rtNumber) === rtResident.rtNumber &&
                ((_d = (_c = complaint.creator) === null || _c === void 0 ? void 0 : _c.resident) === null || _d === void 0 ? void 0 : _d.rwNumber) === rtResident.rwNumber) {
                return true;
            }
        }
        // Warga can only access their own complaints
        return false;
    });
}
// Helper function to check if a user can update a specific complaint
function canUpdateComplaint(complaintId, currentUser) {
    return __awaiter(this, void 0, void 0, function* () {
        // Admin and RW can update all complaints
        if ((0, helpers_1.hasPermission)(currentUser.role, 'RW')) {
            return true;
        }
        const complaint = yield prisma.complaint.findUnique({
            where: { id: complaintId },
        });
        if (!complaint) {
            return false;
        }
        // Creator can update their own complaints
        if (complaint.createdBy === currentUser.id) {
            return true;
        }
        // RT can update complaints from their RT
        if (currentUser.role === 'RT') {
            return yield canAccessComplaint(complaintId, currentUser);
        }
        return false;
    });
}
// Helper function to check if a user can delete a specific complaint
function canDeleteComplaint(complaintId, currentUser) {
    return __awaiter(this, void 0, void 0, function* () {
        // Only Admin and RW can delete complaints
        if ((0, helpers_1.hasPermission)(currentUser.role, 'RW')) {
            return true;
        }
        const complaint = yield prisma.complaint.findUnique({
            where: { id: complaintId },
        });
        if (!complaint) {
            return false;
        }
        // Creator can delete their own complaints if they are still in DITERIMA status
        if (complaint.createdBy === currentUser.id && complaint.status === 'DITERIMA') {
            return true;
        }
        return false;
    });
}
// Helper function to check if a user can respond to a specific complaint
function canRespondToComplaint(complaintId, currentUser) {
    return __awaiter(this, void 0, void 0, function* () {
        // Only Admin, RW, and RT can respond to complaints
        if (currentUser.role === 'WARGA') {
            return false;
        }
        // Admin and RW can respond to all complaints
        if ((0, helpers_1.hasPermission)(currentUser.role, 'RW')) {
            return true;
        }
        // RT can respond to complaints from their RT
        if (currentUser.role === 'RT') {
            return yield canAccessComplaint(complaintId, currentUser);
        }
        return false;
    });
}
// Helper function to create notifications for new complaints
function createComplaintNotifications(complaint) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get the complaint creator's RT and RW
            const complaintCreator = yield prisma.user.findUnique({
                where: { id: complaint.createdBy },
                include: {
                    resident: true,
                },
            });
            if (!(complaintCreator === null || complaintCreator === void 0 ? void 0 : complaintCreator.resident)) {
                return;
            }
            // Get all RT users for the creator's RT
            const rtUsers = yield prisma.user.findMany({
                where: {
                    role: 'RT',
                    resident: {
                        rtNumber: complaintCreator.resident.rtNumber,
                        rwNumber: complaintCreator.resident.rwNumber,
                    },
                },
            });
            // Get all RW users
            const rwUsers = yield prisma.user.findMany({
                where: {
                    role: 'RW',
                },
            });
            // Create notifications for RT users
            for (const rtUser of rtUsers) {
                yield prisma.notification.create({
                    data: {
                        userId: rtUser.id,
                        type: 'COMPLAINT',
                        title: 'New Complaint Submitted',
                        message: `A new complaint has been submitted: ${complaint.title}`,
                        data: JSON.stringify({ complaintId: complaint.id }),
                    },
                });
            }
            // Create notifications for RW users
            for (const rwUser of rwUsers) {
                yield prisma.notification.create({
                    data: {
                        userId: rwUser.id,
                        type: 'COMPLAINT',
                        title: 'New Complaint Submitted',
                        message: `A new complaint has been submitted: ${complaint.title}`,
                        data: JSON.stringify({ complaintId: complaint.id }),
                    },
                });
            }
        }
        catch (error) {
            console.error('Error creating complaint notifications:', error);
        }
    });
}
// Helper function to create notification for complaint response
function createResponseNotification(complaint) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create notification for the complaint creator
            yield prisma.notification.create({
                data: {
                    userId: complaint.createdBy,
                    type: 'COMPLAINT',
                    title: 'Complaint Updated',
                    message: `Your complaint "${complaint.title}" has been updated to ${complaint.status}`,
                    data: JSON.stringify({ complaintId: complaint.id }),
                },
            });
        }
        catch (error) {
            console.error('Error creating response notification:', error);
        }
    });
}
