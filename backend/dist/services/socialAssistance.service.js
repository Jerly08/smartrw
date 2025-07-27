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
exports.getSocialAssistanceStatistics = exports.removeRecipient = exports.updateRecipient = exports.addSocialAssistanceRecipient = exports.getSocialAssistanceRecipients = exports.deleteSocialAssistance = exports.updateSocialAssistance = exports.createSocialAssistance = exports.getSocialAssistanceById = exports.getAllSocialAssistance = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const notificationService = __importStar(require("./notification.service"));
const prisma = new client_1.PrismaClient();
// Get all social assistance programs
const getAllSocialAssistance = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, search, type, status, startDate, endDate, source } = params;
    // Calculate pagination
    const skip = (page - 1) * limit;
    // Build where conditions
    const whereConditions = {};
    if (search) {
        whereConditions.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
            { source: { contains: search } },
        ];
    }
    if (type) {
        whereConditions.type = type;
    }
    if (status) {
        whereConditions.status = status;
    }
    if (startDate) {
        whereConditions.startDate = Object.assign(Object.assign({}, (whereConditions.startDate || {})), { gte: startDate });
    }
    if (endDate) {
        whereConditions.endDate = Object.assign(Object.assign({}, (whereConditions.endDate || {})), { lte: endDate });
    }
    if (source) {
        whereConditions.source = { contains: source };
    }
    // Get social assistance programs with pagination
    const programs = yield prisma.socialAssistance.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            startDate: 'desc',
        },
        include: {
            _count: {
                select: {
                    recipients: true,
                }
            }
        }
    });
    // Get total count for pagination
    const totalItems = yield prisma.socialAssistance.count({
        where: whereConditions,
    });
    return {
        programs,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
    };
});
exports.getAllSocialAssistance = getAllSocialAssistance;
// Get social assistance by ID
const getSocialAssistanceById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const program = yield prisma.socialAssistance.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    recipients: true,
                }
            }
        }
    });
    if (!program) {
        throw new error_middleware_1.ApiError('Social assistance program not found', 404);
    }
    return program;
});
exports.getSocialAssistanceById = getSocialAssistanceById;
// Create social assistance program
const createSocialAssistance = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma.socialAssistance.create({
        data
    });
});
exports.createSocialAssistance = createSocialAssistance;
// Update social assistance
const updateSocialAssistance = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if program exists
    const exists = yield prisma.socialAssistance.findUnique({ where: { id } });
    if (!exists) {
        throw new error_middleware_1.ApiError('Social assistance program not found', 404);
    }
    return yield prisma.socialAssistance.update({
        where: { id },
        data
    });
});
exports.updateSocialAssistance = updateSocialAssistance;
// Delete social assistance
const deleteSocialAssistance = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if program exists
    const exists = yield prisma.socialAssistance.findUnique({ where: { id } });
    if (!exists) {
        throw new error_middleware_1.ApiError('Social assistance program not found', 404);
    }
    // Delete recipients first (cascade should handle this, but just in case)
    yield prisma.socialAssistanceRecipient.deleteMany({
        where: { socialAssistanceId: id }
    });
    return yield prisma.socialAssistance.delete({
        where: { id }
    });
});
exports.deleteSocialAssistance = deleteSocialAssistance;
// Get recipients of a social assistance program
const getSocialAssistanceRecipients = (assistanceId, params, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, verified, rtNumber } = params;
    // Calculate pagination
    const skip = (page - 1) * limit;
    // Build where conditions for recipients
    const whereConditions = {
        socialAssistanceId: assistanceId
    };
    if (verified !== undefined) {
        whereConditions.isVerified = verified;
    }
    // Handle role-based filtering
    if (currentUser.role === 'RT') {
        const rtResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id }
        });
        if (!rtResident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        // RT can only see recipients in their RT
        whereConditions.resident = {
            rtNumber: rtResident.rtNumber,
            rwNumber: rtResident.rwNumber
        };
    }
    else if (currentUser.role === 'WARGA') {
        const resident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id }
        });
        if (!resident) {
            throw new error_middleware_1.ApiError('Resident profile not found', 404);
        }
        // Warga can only see their own recipient records
        whereConditions.residentId = resident.id;
    }
    else if (rtNumber) {
        // Admin/RW can filter by RT if provided
        whereConditions.resident = {
            rtNumber
        };
    }
    // Get recipients with pagination
    const recipients = yield prisma.socialAssistanceRecipient.findMany({
        where: whereConditions,
        include: {
            resident: {
                select: {
                    id: true,
                    nik: true,
                    fullName: true,
                    rtNumber: true,
                    rwNumber: true,
                    address: true,
                    phoneNumber: true
                }
            }
        },
        skip,
        take: limit,
        orderBy: [
            { isVerified: 'asc' },
            { resident: { rtNumber: 'asc' } }
        ]
    });
    // Get total count for pagination
    const totalItems = yield prisma.socialAssistanceRecipient.count({
        where: whereConditions
    });
    return {
        recipients,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page
    };
});
exports.getSocialAssistanceRecipients = getSocialAssistanceRecipients;
// Add recipient to social assistance program
const addSocialAssistanceRecipient = (assistanceId, data, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if social assistance exists
    const assistance = yield prisma.socialAssistance.findUnique({
        where: { id: assistanceId }
    });
    if (!assistance) {
        throw new error_middleware_1.ApiError('Social assistance program not found', 404);
    }
    // Check if resident exists
    const resident = yield prisma.resident.findUnique({
        where: { id: data.residentId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });
    if (!resident) {
        throw new error_middleware_1.ApiError('Resident not found', 404);
    }
    // Check if resident is already a recipient
    const existingRecipient = yield prisma.socialAssistanceRecipient.findFirst({
        where: {
            socialAssistanceId: assistanceId,
            residentId: data.residentId
        }
    });
    if (existingRecipient) {
        throw new error_middleware_1.ApiError('Resident is already a recipient of this program', 400);
    }
    // Add recipient
    const recipient = yield prisma.socialAssistanceRecipient.create({
        data: {
            socialAssistanceId: assistanceId,
            residentId: data.residentId,
            notes: data.notes
        },
        include: {
            resident: true,
            socialAssistance: true
        }
    });
    // Create notification for resident if they have a user account
    if (resident.user) {
        yield notificationService.createNotification({
            userId: resident.user.id,
            type: 'SOCIAL_ASSISTANCE',
            title: 'Bantuan Sosial',
            message: `Anda terdaftar sebagai calon penerima bantuan ${assistance.name}`,
            priority: 'NORMAL',
            socialAssistanceId: assistanceId,
            data: {
                assistanceName: assistance.name,
                assistanceType: assistance.type,
                assistanceStatus: assistance.status
            }
        });
    }
    // Create notifications for RT users
    yield createSocialAssistanceNotificationsForRT(recipient);
    return recipient;
});
exports.addSocialAssistanceRecipient = addSocialAssistanceRecipient;
// Helper function to create notifications for RT users when social assistance needs verification
function createSocialAssistanceNotificationsForRT(recipient) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { resident, socialAssistance } = recipient;
            if (!resident || !socialAssistance) {
                console.error('Recipient data incomplete');
                return;
            }
            const { rtNumber, rwNumber } = resident;
            // Get all RT users for the recipient's RT
            const rtUsers = yield prisma.user.findMany({
                where: {
                    role: 'RT',
                    resident: {
                        rtNumber,
                        rwNumber,
                    },
                },
            });
            // Create notifications for RT users
            for (const rtUser of rtUsers) {
                yield prisma.notification.create({
                    data: {
                        userId: rtUser.id,
                        type: 'SOCIAL_ASSISTANCE',
                        title: 'Verifikasi Bantuan Sosial',
                        message: `Calon penerima bantuan ${socialAssistance.name} memerlukan verifikasi Anda`,
                        priority: 'HIGH',
                        socialAssistanceId: socialAssistance.id,
                        data: JSON.stringify({
                            assistanceId: socialAssistance.id,
                            assistanceName: socialAssistance.name,
                            assistanceType: socialAssistance.type,
                            recipientId: recipient.id,
                            residentName: resident.fullName,
                            residentNik: resident.nik,
                            residentAddress: resident.address,
                        }),
                    },
                });
            }
        }
        catch (error) {
            console.error('Error creating social assistance notifications for RT:', error);
        }
    });
}
// Update recipient information
const updateRecipient = (recipientId, data, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if recipient exists
    const recipient = yield prisma.socialAssistanceRecipient.findUnique({
        where: { id: recipientId },
        include: {
            resident: true
        }
    });
    if (!recipient) {
        throw new error_middleware_1.ApiError('Recipient not found', 404);
    }
    const updateData = Object.assign({}, data);
    // If verifying, add verification info
    if (data.isVerified === true) {
        updateData.verifiedBy = currentUser.name || `User ${currentUser.id}`;
        updateData.verifiedAt = new Date();
    }
    return yield prisma.socialAssistanceRecipient.update({
        where: { id: recipientId },
        data: updateData,
        include: {
            resident: {
                select: {
                    fullName: true,
                    nik: true,
                    rtNumber: true,
                    rwNumber: true
                }
            }
        }
    });
});
exports.updateRecipient = updateRecipient;
// Remove recipient from program
const removeRecipient = (recipientId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if recipient exists
    const recipient = yield prisma.socialAssistanceRecipient.findUnique({
        where: { id: recipientId }
    });
    if (!recipient) {
        throw new error_middleware_1.ApiError('Recipient not found', 404);
    }
    return yield prisma.socialAssistanceRecipient.delete({
        where: { id: recipientId }
    });
});
exports.removeRecipient = removeRecipient;
// Get social assistance statistics
const getSocialAssistanceStatistics = (currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    let rtFilter = {};
    // If RT, limit to their area
    if (currentUser.role === 'RT') {
        const rtResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id }
        });
        if (!rtResident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        rtFilter = {
            resident: {
                rtNumber: rtResident.rtNumber,
                rwNumber: rtResident.rwNumber
            }
        };
    }
    else if (currentUser.role === 'WARGA') {
        const resident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id }
        });
        if (!resident) {
            throw new error_middleware_1.ApiError('Resident profile not found', 404);
        }
        rtFilter = {
            residentId: resident.id
        };
    }
    // Total programs
    const totalPrograms = yield prisma.socialAssistance.count();
    // Active programs
    const activePrograms = yield prisma.socialAssistance.count({
        where: {
            status: { in: ['DISIAPKAN', 'DISALURKAN'] },
            endDate: {
                gt: new Date()
            }
        }
    });
    // Programs by type
    const programsByType = yield prisma.socialAssistance.groupBy({
        by: ['type'],
        _count: {
            id: true
        }
    });
    // Programs by status
    const programsByStatus = yield prisma.socialAssistance.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    });
    // Total recipients
    const totalRecipients = yield prisma.socialAssistanceRecipient.count({
        where: rtFilter
    });
    // Verified recipients
    const verifiedRecipients = yield prisma.socialAssistanceRecipient.count({
        where: Object.assign(Object.assign({}, rtFilter), { isVerified: true })
    });
    return {
        programs: {
            total: totalPrograms,
            active: activePrograms,
            byType: programsByType,
            byStatus: programsByStatus
        },
        recipients: {
            total: totalRecipients,
            verified: verifiedRecipients,
            percentVerified: totalRecipients > 0
                ? Math.round((verifiedRecipients / totalRecipients) * 100)
                : 0
        }
    };
});
exports.getSocialAssistanceStatistics = getSocialAssistanceStatistics;
