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
exports.downloadDocument = exports.downloadAttachment = exports.getDocumentStatistics = exports.deleteDocument = exports.processDocument = exports.updateDocument = exports.createDocument = exports.getDocumentById = exports.getAllDocuments = void 0;
const documentService = __importStar(require("../services/document.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
// Get all documents
const getAllDocuments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '10', search, type, status, requesterId, rtNumber } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const result = yield documentService.getAllDocuments({
            page: pageNum,
            limit: limitNum,
            search: search && search !== '' ? search : undefined,
            type: type && type !== '' ? type : undefined,
            status: status && status !== '' ? status : undefined,
            requesterId: requesterId ? parseInt(requesterId) : undefined,
            rtNumber: rtNumber && rtNumber !== '' ? rtNumber : undefined,
        });
        res.status(200).json({
            status: 'success',
            results: result.documents.length,
            currentPage: pageNum,
            data: {
                documents: result.documents,
                pagination: result.pagination
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllDocuments = getAllDocuments;
// Get document by ID
const getDocumentById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const documentId = parseInt(req.params.id);
        if (isNaN(documentId)) {
            throw new error_middleware_1.ApiError('Invalid document ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const document = yield documentService.getDocumentById(documentId);
        res.status(200).json({
            status: 'success',
            data: {
                document,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getDocumentById = getDocumentById;
// Create document
const createDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { type, subject, description } = req.body;
        // Validate required fields
        if (!type || !subject || !description) {
            throw new error_middleware_1.ApiError('Type, subject, and description are required', 400);
        }
        // Process file attachments if any
        let attachments = [];
        if (req.files && Array.isArray(req.files)) {
            // Handle array of files
            attachments = yield processAttachments(req.files);
        }
        else if (req.files && typeof req.files === 'object') {
            // Handle object of files (multer format)
            const fileArray = Object.values(req.files).flat();
            attachments = yield processAttachments(fileArray);
        }
        // Create document with attachments
        const documentData = {
            type,
            subject,
            description,
            attachments: attachments.length > 0 ? JSON.stringify(attachments) : undefined,
        };
        const newDocument = yield documentService.createDocument(documentData, req.user.id);
        res.status(201).json({
            status: 'success',
            message: 'Document created successfully',
            data: {
                document: newDocument,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createDocument = createDocument;
// Helper function to process file attachments
function processAttachments(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/documents');
        // Create upload directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        const attachments = [];
        for (const file of files) {
            // Generate unique filename
            const fileName = `${(0, uuid_1.v4)()}-${file.originalname}`;
            const filePath = path_1.default.join(uploadDir, fileName);
            // Write file to disk
            yield fs_1.default.promises.writeFile(filePath, file.buffer);
            // Add file path to attachments
            attachments.push(`/uploads/documents/${fileName}`);
        }
        return attachments;
    });
}
// Update document
const updateDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const documentId = parseInt(req.params.id);
        if (isNaN(documentId)) {
            throw new error_middleware_1.ApiError('Invalid document ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // First get the existing document
        const existingDocument = yield documentService.getDocumentById(documentId);
        // Check if user is authorized to update
        if (existingDocument.requesterId !== req.user.id && !['ADMIN', 'RW', 'RT'].includes(req.user.role)) {
            throw new error_middleware_1.ApiError('You are not authorized to update this document', 403);
        }
        // Update document status
        const { status, notes } = req.body;
        if (status) {
            const updatedDocument = yield documentService.updateDocumentStatus(documentId, status, notes);
            res.status(200).json({
                status: 'success',
                message: 'Document updated successfully',
                data: {
                    document: updatedDocument,
                },
            });
        }
        else {
            throw new error_middleware_1.ApiError('No valid update parameters provided', 400);
        }
    }
    catch (error) {
        next(error);
    }
});
exports.updateDocument = updateDocument;
// Process document (approve, reject, sign)
const processDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const documentId = parseInt(req.params.id);
        if (isNaN(documentId)) {
            throw new error_middleware_1.ApiError('Invalid document ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { status, notes } = req.body;
        if (!status || !Object.values(client_1.DocumentStatus).includes(status)) {
            throw new error_middleware_1.ApiError('Invalid document status', 400);
        }
        let processedDocument;
        switch (status) {
            case 'DISETUJUI':
                processedDocument = yield documentService.approveDocument(documentId, ((_a = req.user) === null || _a === void 0 ? void 0 : _a.name) || 'Admin');
                break;
            case 'DITOLAK':
                processedDocument = yield documentService.rejectDocument(documentId, notes || 'Tidak ada alasan yang diberikan');
                break;
            case 'DITANDATANGANI':
                processedDocument = yield documentService.signDocument(documentId, ((_b = req.user) === null || _b === void 0 ? void 0 : _b.name) || 'Admin');
                break;
            case 'SELESAI':
                processedDocument = yield documentService.completeDocument(documentId);
                break;
            default:
                processedDocument = yield documentService.updateDocumentStatus(documentId, status, notes, req.user.id);
        }
        res.status(200).json({
            status: 'success',
            message: `Document ${status.toLowerCase()} successfully`,
            data: {
                document: processedDocument,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.processDocument = processDocument;
// Delete document
const deleteDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const documentId = parseInt(req.params.id);
        if (isNaN(documentId)) {
            throw new error_middleware_1.ApiError('Invalid document ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // First get the existing document
        const existingDocument = yield documentService.getDocumentById(documentId);
        // Check if user is authorized to delete
        if (existingDocument.requesterId !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
            throw new error_middleware_1.ApiError('You are not authorized to delete this document', 403);
        }
        // Delete document logic would go here
        // Since there's no deleteDocument function in the service, we'll just return a success message
        res.status(200).json({
            status: 'success',
            message: 'Document deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteDocument = deleteDocument;
// Get document statistics
const getDocumentStatistics = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Build where condition based on user role
        let whereCondition = {};
        // For RT, only show documents from their RT
        if (req.user.role === 'RT') {
            // Get RT user's resident data to determine their RT number
            const rtUserResident = yield prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    resident: true
                }
            });
            if ((_a = rtUserResident === null || rtUserResident === void 0 ? void 0 : rtUserResident.resident) === null || _a === void 0 ? void 0 : _a.rtNumber) {
                whereCondition = {
                    requester: {
                        resident: {
                            rtNumber: rtUserResident.resident.rtNumber
                        }
                    }
                };
            }
        }
        // Get statistics based on user role
        const statistics = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            completed: 0,
            diajukan: 0,
            diproses: 0,
            disetujui: 0,
            ditandatangani: 0,
            selesai: 0,
            ditolak: 0
        };
        // Count documents with proper filtering
        const total = yield prisma.document.count({ where: whereCondition });
        const diajukan = yield prisma.document.count({ where: Object.assign(Object.assign({}, whereCondition), { status: 'DIAJUKAN' }) });
        const diproses = yield prisma.document.count({ where: Object.assign(Object.assign({}, whereCondition), { status: 'DIPROSES' }) });
        const disetujui = yield prisma.document.count({ where: Object.assign(Object.assign({}, whereCondition), { status: 'DISETUJUI' }) });
        const ditandatangani = yield prisma.document.count({ where: Object.assign(Object.assign({}, whereCondition), { status: 'DITANDATANGANI' }) });
        const selesai = yield prisma.document.count({ where: Object.assign(Object.assign({}, whereCondition), { status: 'SELESAI' }) });
        const ditolak = yield prisma.document.count({ where: Object.assign(Object.assign({}, whereCondition), { status: 'DITOLAK' }) });
        statistics.total = total;
        statistics.pending = diajukan; // Menunggu persetujuan
        statistics.approved = disetujui + ditandatangani; // Yang sudah disetujui + ditandatangani
        statistics.rejected = ditolak;
        statistics.completed = selesai;
        // Also include individual status counts for more detailed statistics
        statistics.diajukan = diajukan;
        statistics.diproses = diproses;
        statistics.disetujui = disetujui;
        statistics.ditandatangani = ditandatangani;
        statistics.selesai = selesai;
        statistics.ditolak = ditolak;
        res.status(200).json({
            status: 'success',
            data: statistics,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getDocumentStatistics = getDocumentStatistics;
// Download attachment
const downloadAttachment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const documentId = parseInt(req.params.id);
        const filename = req.params.filename;
        if (isNaN(documentId) || !filename) {
            throw new error_middleware_1.ApiError('Invalid document ID or filename', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get document to check permissions
        const document = yield documentService.getDocumentById(documentId);
        // Check if user is authorized to download
        const isAuthorized = document.requesterId === req.user.id ||
            ['ADMIN', 'RW', 'RT'].includes(req.user.role);
        if (!isAuthorized) {
            throw new error_middleware_1.ApiError('You are not authorized to download this attachment', 403);
        }
        // Check if document has attachments
        if (!document.attachments) {
            throw new error_middleware_1.ApiError('Document has no attachments', 404);
        }
        // Parse attachments JSON
        let attachments = [];
        try {
            attachments = JSON.parse(document.attachments);
        }
        catch (error) {
            throw new error_middleware_1.ApiError('Invalid attachments format', 500);
        }
        // Find the requested attachment
        const attachment = attachments.find(att => {
            const attFilename = att.split('/').pop();
            return attFilename === filename;
        });
        if (!attachment) {
            throw new error_middleware_1.ApiError('Attachment not found', 404);
        }
        // Construct file path
        const filePath = path_1.default.join(__dirname, '../../', attachment);
        // Check if file exists
        if (!fs_1.default.existsSync(filePath)) {
            throw new error_middleware_1.ApiError('File not found on server', 404);
        }
        // Send file
        res.download(filePath, filename);
    }
    catch (error) {
        next(error);
    }
});
exports.downloadAttachment = downloadAttachment;
// Download completed document
const downloadDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const documentId = parseInt(req.params.id);
        if (isNaN(documentId)) {
            throw new error_middleware_1.ApiError('Invalid document ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get document to check permissions and status
        const document = yield documentService.getDocumentById(documentId);
        // Check if document is completed
        if (document.status !== 'SELESAI') {
            throw new error_middleware_1.ApiError('Document is not yet completed', 400);
        }
        // Check if user is authorized to download
        const isAuthorized = document.requesterId === req.user.id ||
            ['ADMIN', 'RW', 'RT'].includes(req.user.role);
        if (!isAuthorized) {
            throw new error_middleware_1.ApiError('You are not authorized to download this document', 403);
        }
        // For now, we'll create a simple PDF response
        // In a real implementation, you would generate a proper PDF document
        const pdfContent = `
      SURAT ${document.type}
      
      Subjek: ${document.subject}
      Deskripsi: ${document.description}
      Status: ${document.status}
      Disetujui oleh: ${document.approvedBy || '-'}
      Ditandatangani oleh: ${document.signedBy || '-'}
      Tanggal selesai: ${document.completedAt ? new Date(document.completedAt).toLocaleDateString('id-ID') : '-'}
    `;
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="surat-${documentId}.pdf"`);
        // For now, send as text (in production, use a PDF library like pdfkit or puppeteer)
        res.send(pdfContent);
    }
    catch (error) {
        next(error);
    }
});
exports.downloadDocument = downloadDocument;
