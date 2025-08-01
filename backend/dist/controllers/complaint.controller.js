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
exports.downloadAttachment = exports.getComplaintStatistics = exports.respondToComplaint = exports.deleteComplaint = exports.updateComplaint = exports.createComplaint = exports.getComplaintById = exports.getAllComplaints = void 0;
const complaintService = __importStar(require("../services/complaint.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
// Get all complaints
const getAllComplaints = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '10', search, category, status, startDate, endDate, rtNumber, rwNumber } = req.query;
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
        const result = yield complaintService.getAllComplaints({
            page: pageNum,
            limit: limitNum,
            search: search && search !== '' ? search : undefined,
            category: category && category !== '' ? category : undefined,
            status: status && status !== '' ? status : undefined,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            rtNumber: rtNumber && rtNumber !== '' ? rtNumber : undefined,
            rwNumber: rwNumber && rwNumber !== '' ? rwNumber : undefined,
        }, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            results: result.complaints.length,
            totalPages: result.totalPages,
            currentPage: pageNum,
            totalItems: result.totalItems,
            data: {
                complaints: result.complaints,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllComplaints = getAllComplaints;
// Get complaint by ID
const getComplaintById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const complaintId = parseInt(req.params.id);
        if (isNaN(complaintId)) {
            throw new error_middleware_1.ApiError('Invalid complaint ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const complaint = yield complaintService.getComplaintById(complaintId, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            data: {
                complaint,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getComplaintById = getComplaintById;
// Create complaint
const createComplaint = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const complaintData = req.body;
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
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
        // Add attachments to complaint data
        const complaintDataWithAttachments = Object.assign(Object.assign({}, complaintData), { attachments: attachments.length > 0 ? JSON.stringify(attachments) : undefined });
        const newComplaint = yield complaintService.createComplaint(complaintDataWithAttachments, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(201).json({
            status: 'success',
            message: 'Complaint created successfully',
            data: {
                complaint: newComplaint,
            },
        });
    }
    catch (error) {
        console.error('Error creating complaint:', error);
        // Handle specific ApiError
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: 'error',
                message: error.message,
            });
        }
        next(error);
    }
});
exports.createComplaint = createComplaint;
// Helper function to process file attachments
function processAttachments(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/complaints');
        // Create upload directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        const attachments = [];
        for (const file of files) {
            // Check if file has buffer (memory storage)
            if (!file.buffer) {
                console.warn('File buffer is undefined, skipping file:', file.originalname);
                continue;
            }
            // Generate unique filename
            const fileName = `${(0, uuid_1.v4)()}-${file.originalname}`;
            const filePath = path_1.default.join(uploadDir, fileName);
            // Write file to disk
            yield fs_1.default.promises.writeFile(filePath, file.buffer);
            // Add file path to attachments
            attachments.push(`/uploads/complaints/${fileName}`);
        }
        return attachments;
    });
}
// Update complaint
const updateComplaint = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const complaintId = parseInt(req.params.id);
        if (isNaN(complaintId)) {
            throw new error_middleware_1.ApiError('Invalid complaint ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const complaintData = req.body;
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
        // Add attachments to complaint data if files were uploaded
        const complaintDataWithAttachments = Object.assign(Object.assign({}, complaintData), (attachments.length > 0 && { attachments: JSON.stringify(attachments) }));
        const updatedComplaint = yield complaintService.updateComplaint(complaintId, complaintDataWithAttachments, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            message: 'Complaint updated successfully',
            data: {
                complaint: updatedComplaint,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateComplaint = updateComplaint;
// Delete complaint
const deleteComplaint = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const complaintId = parseInt(req.params.id);
        if (isNaN(complaintId)) {
            throw new error_middleware_1.ApiError('Invalid complaint ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        yield complaintService.deleteComplaint(complaintId, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            message: 'Complaint deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteComplaint = deleteComplaint;
// Respond to complaint
const respondToComplaint = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const complaintId = parseInt(req.params.id);
        if (isNaN(complaintId)) {
            throw new error_middleware_1.ApiError('Invalid complaint ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { response, status } = req.body;
        if (!response || !status) {
            throw new error_middleware_1.ApiError('Response and status are required', 400);
        }
        const validStatuses = ['DITINDAKLANJUTI', 'SELESAI', 'DITOLAK'];
        if (!validStatuses.includes(status)) {
            throw new error_middleware_1.ApiError('Invalid status', 400);
        }
        // Get user details to use as responder name
        const responderName = req.user.email || `User ${req.user.id}`;
        const updatedComplaint = yield complaintService.respondToComplaint(complaintId, response, status, {
            id: req.user.id,
            role: req.user.role,
            name: responderName
        });
        res.status(200).json({
            status: 'success',
            message: 'Response added successfully',
            data: {
                complaint: updatedComplaint,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.respondToComplaint = respondToComplaint;
// Get complaint statistics
const getComplaintStatistics = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const statistics = yield complaintService.getComplaintStatistics({
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
exports.getComplaintStatistics = getComplaintStatistics;
// Download complaint attachment
const downloadAttachment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const complaintId = parseInt(req.params.id);
        const filename = req.params.filename;
        if (isNaN(complaintId)) {
            throw new error_middleware_1.ApiError('Invalid complaint ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get complaint to check if attachment exists
        const complaint = yield complaintService.getComplaintById(complaintId, {
            id: req.user.id,
            role: req.user.role
        });
        // Check if complaint has attachments
        if (!complaint.attachments) {
            throw new error_middleware_1.ApiError('Complaint has no attachments', 404);
        }
        // Parse attachments JSON
        const attachments = JSON.parse(complaint.attachments);
        // Find the requested attachment
        const attachmentPath = attachments.find((path) => path.includes(filename));
        if (!attachmentPath) {
            throw new error_middleware_1.ApiError('Attachment not found', 404);
        }
        // Get the file path on disk
        const filePath = path_1.default.join(__dirname, '../../', attachmentPath);
        // Check if file exists
        if (!fs_1.default.existsSync(filePath)) {
            throw new error_middleware_1.ApiError('File not found on server', 404);
        }
        // Set content disposition header to force download
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        // Stream the file
        const fileStream = fs_1.default.createReadStream(filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        next(error);
    }
});
exports.downloadAttachment = downloadAttachment;
