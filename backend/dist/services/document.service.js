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
exports.completeDocument = exports.signDocument = exports.rejectDocument = exports.approveDocument = exports.updateDocumentStatus = exports.createDocument = exports.getDocumentById = exports.getAllDocuments = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const notificationService = __importStar(require("./notification.service"));
const prisma = new client_1.PrismaClient();
// Get all documents with filtering
const getAllDocuments = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (params = {}) {
    const { page = 1, limit = 10, search, type, status, requesterId, rtNumber } = params;
    const skip = (page - 1) * limit;
    // Build where conditions
    const where = {};
    if (search) {
        where.OR = [
            { subject: { contains: search } },
            { description: { contains: search } },
        ];
    }
    if (type) {
        where.type = type;
    }
    if (status) {
        where.status = status;
    }
    if (requesterId) {
        where.requesterId = requesterId;
    }
    // Filter by RT if specified
    if (rtNumber) {
        where.requester = {
            resident: {
                rtNumber,
            },
        };
    }
    // Get total count for pagination
    const total = yield prisma.document.count({ where });
    // Get documents
    const documents = yield prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
            requester: {
                select: {
                    id: true,
                    name: true,
                    resident: {
                        select: {
                            id: true,
                            fullName: true,
                            rtNumber: true,
                            rwNumber: true,
                        },
                    },
                },
            },
        },
    });
    return {
        documents,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getAllDocuments = getAllDocuments;
// Get document by ID
const getDocumentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield prisma.document.findUnique({
        where: { id },
        include: {
            requester: {
                select: {
                    id: true,
                    name: true,
                    resident: {
                        select: {
                            id: true,
                            fullName: true,
                            rtNumber: true,
                            rwNumber: true,
                        },
                    },
                },
            },
        },
    });
    if (!document) {
        throw new error_middleware_1.ApiError('Document not found', 404);
    }
    return document;
});
exports.getDocumentById = getDocumentById;
// Create new document
const createDocument = (data, requesterId) => __awaiter(void 0, void 0, void 0, function* () {
    // Create document
    const document = yield prisma.document.create({
        data: Object.assign(Object.assign({}, data), { requesterId }),
        include: {
            requester: {
                select: {
                    id: true,
                    name: true,
                    resident: true,
                },
            },
        },
    });
    // Create notification for document submission
    yield notificationService.createNotification({
        userId: requesterId,
        type: 'DOCUMENT',
        title: 'Pengajuan Surat',
        message: `Surat ${document.type} Anda telah diajukan dan sedang dalam proses`,
        priority: 'NORMAL',
        documentId: document.id,
        data: {
            documentType: document.type,
            documentSubject: document.subject,
            documentStatus: document.status,
        },
    });
    // Send notification to RT users
    yield createDocumentNotificationsForRT(document);
    return document;
});
exports.createDocument = createDocument;
// Helper function to create notifications for RT users when documents need verification
function createDocumentNotificationsForRT(document) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Get the document requester's RT and RW
            if (!((_a = document.requester) === null || _a === void 0 ? void 0 : _a.resident)) {
                // Try to fetch resident data if not included
                const requester = yield prisma.user.findUnique({
                    where: { id: document.requesterId },
                    include: {
                        resident: true,
                    },
                });
                if (!(requester === null || requester === void 0 ? void 0 : requester.resident)) {
                    console.error('Requester resident data not found');
                    return;
                }
                document.requester = requester;
            }
            const { rtNumber, rwNumber } = document.requester.resident;
            // Get all RT users for the requester's RT
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
                        type: 'DOCUMENT',
                        title: 'Dokumen Memerlukan Verifikasi RT',
                        message: `Dokumen ${document.type} dari ${document.requester.name} memerlukan verifikasi Anda`,
                        priority: 'HIGH',
                        documentId: document.id,
                        data: JSON.stringify({
                            documentId: document.id,
                            documentType: document.type,
                            documentSubject: document.subject,
                            requesterName: document.requester.name,
                            requesterNik: document.requester.resident.nik,
                        }),
                    },
                });
            }
        }
        catch (error) {
            console.error('Error creating document notifications for RT:', error);
        }
    });
}
// Update document status
const updateDocumentStatus = (id, status, notes, updatedByUserId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if document exists
    const document = yield prisma.document.findUnique({
        where: { id },
        include: {
            requester: true,
        },
    });
    if (!document) {
        throw new error_middleware_1.ApiError('Document not found', 404);
    }
    // Update document
    const updatedDocument = yield prisma.document.update({
        where: { id },
        data: {
            status,
            rejectionReason: status === 'DITOLAK' ? notes : undefined,
        },
    });
    // Create notification for status update
    let notificationTitle = 'Status Pengajuan Surat';
    let notificationMessage = '';
    switch (status) {
        case 'DIPROSES':
            notificationMessage = `Surat ${document.type} Anda sedang diproses`;
            break;
        case 'DITOLAK':
            notificationMessage = `Surat ${document.type} Anda ditolak. Alasan: ${notes || 'Tidak ada alasan yang diberikan'}`;
            break;
        case 'DISETUJUI':
            notificationMessage = `Surat ${document.type} Anda telah disetujui`;
            break;
        case 'DITANDATANGANI':
            notificationMessage = `Surat ${document.type} Anda telah ditandatangani`;
            break;
        case 'SELESAI':
            notificationMessage = `Surat ${document.type} Anda telah selesai dan siap diambil`;
            break;
        default:
            notificationMessage = `Status surat ${document.type} Anda telah diperbarui menjadi ${status}`;
    }
    yield notificationService.createNotification({
        userId: document.requesterId,
        type: 'DOCUMENT',
        title: notificationTitle,
        message: notificationMessage,
        priority: status === 'SELESAI' ? 'HIGH' : 'NORMAL',
        documentId: document.id,
        data: {
            documentType: document.type,
            documentSubject: document.subject,
            documentStatus: status,
            notes: notes,
        },
    });
    return updatedDocument;
});
exports.updateDocumentStatus = updateDocumentStatus;
// Approve document
const approveDocument = (id, approvedBy) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if document exists
    const document = yield prisma.document.findUnique({
        where: { id },
    });
    if (!document) {
        throw new error_middleware_1.ApiError('Document not found', 404);
    }
    // Update document
    const updatedDocument = yield prisma.document.update({
        where: { id },
        data: {
            status: 'DISETUJUI',
            approvedBy,
            approvedAt: new Date(),
        },
    });
    // Create notification for approval
    yield notificationService.createNotification({
        userId: document.requesterId,
        type: 'DOCUMENT',
        title: 'Surat Disetujui',
        message: `Surat ${document.type} Anda telah disetujui`,
        priority: 'NORMAL',
        documentId: document.id,
        data: {
            documentType: document.type,
            documentSubject: document.subject,
            documentStatus: 'DISETUJUI',
            approvedBy,
        },
    });
    return updatedDocument;
});
exports.approveDocument = approveDocument;
// Reject document
const rejectDocument = (id, reason) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if document exists
    const document = yield prisma.document.findUnique({
        where: { id },
    });
    if (!document) {
        throw new error_middleware_1.ApiError('Document not found', 404);
    }
    // Update document
    const updatedDocument = yield prisma.document.update({
        where: { id },
        data: {
            status: 'DITOLAK',
            rejectionReason: reason,
        },
    });
    // Create notification for rejection
    yield notificationService.createNotification({
        userId: document.requesterId,
        type: 'DOCUMENT',
        title: 'Surat Ditolak',
        message: `Surat ${document.type} Anda ditolak. Alasan: ${reason || 'Tidak ada alasan yang diberikan'}`,
        priority: 'HIGH',
        documentId: document.id,
        data: {
            documentType: document.type,
            documentSubject: document.subject,
            documentStatus: 'DITOLAK',
            rejectionReason: reason,
        },
    });
    return updatedDocument;
});
exports.rejectDocument = rejectDocument;
// Sign document
const signDocument = (id, signedBy) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if document exists
    const document = yield prisma.document.findUnique({
        where: { id },
    });
    if (!document) {
        throw new error_middleware_1.ApiError('Document not found', 404);
    }
    // Update document
    const updatedDocument = yield prisma.document.update({
        where: { id },
        data: {
            status: 'DITANDATANGANI',
            signedBy,
            signedAt: new Date(),
        },
    });
    // Create notification for signing
    yield notificationService.createNotification({
        userId: document.requesterId,
        type: 'DOCUMENT',
        title: 'Surat Ditandatangani',
        message: `Surat ${document.type} Anda telah ditandatangani oleh ${signedBy}`,
        priority: 'NORMAL',
        documentId: document.id,
        data: {
            documentType: document.type,
            documentSubject: document.subject,
            documentStatus: 'DITANDATANGANI',
            signedBy,
        },
    });
    return updatedDocument;
});
exports.signDocument = signDocument;
// Complete document
const completeDocument = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if document exists
    const document = yield prisma.document.findUnique({
        where: { id },
    });
    if (!document) {
        throw new error_middleware_1.ApiError('Document not found', 404);
    }
    // Update document
    const updatedDocument = yield prisma.document.update({
        where: { id },
        data: {
            status: 'SELESAI',
            completedAt: new Date(),
        },
    });
    // Create notification for completion
    yield notificationService.createNotification({
        userId: document.requesterId,
        type: 'DOCUMENT',
        title: 'Surat Selesai',
        message: `Surat ${document.type} Anda telah selesai dan siap diambil`,
        priority: 'HIGH',
        documentId: document.id,
        data: {
            documentType: document.type,
            documentSubject: document.subject,
            documentStatus: 'SELESAI',
        },
    });
    return updatedDocument;
});
exports.completeDocument = completeDocument;
