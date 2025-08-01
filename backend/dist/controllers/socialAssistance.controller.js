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
exports.checkResidentEligibility = exports.exportRecipients = exports.getSocialAssistanceStatistics = exports.updateSocialAssistanceStatus = exports.removeRecipient = exports.updateRecipient = exports.addRecipient = exports.getSocialAssistanceRecipients = exports.deleteSocialAssistance = exports.updateSocialAssistance = exports.createSocialAssistance = exports.getSocialAssistanceById = exports.getAllSocialAssistance = void 0;
const socialAssistanceService = __importStar(require("../services/socialAssistance.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all social assistance programs
const getAllSocialAssistance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '10', search, type, status, startDate, endDate, source } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        let parsedStartDate;
        let parsedEndDate;
        if (startDate && !isNaN(Date.parse(startDate))) {
            parsedStartDate = new Date(startDate);
        }
        if (endDate && !isNaN(Date.parse(endDate))) {
            parsedEndDate = new Date(endDate);
        }
        const result = yield socialAssistanceService.getAllSocialAssistance({
            page: pageNum,
            limit: limitNum,
            search: search,
            type: type,
            status: status,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            source: source
        });
        res.status(200).json({
            status: 'success',
            results: result.programs.length,
            totalPages: result.totalPages,
            currentPage: pageNum,
            totalItems: result.totalItems,
            data: {
                programs: result.programs,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllSocialAssistance = getAllSocialAssistance;
// Get social assistance by ID
const getSocialAssistanceById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const assistanceId = parseInt(req.params.id);
        if (isNaN(assistanceId)) {
            throw new error_middleware_1.ApiError('Invalid social assistance ID', 400);
        }
        const program = yield socialAssistanceService.getSocialAssistanceById(assistanceId);
        res.status(200).json({
            status: 'success',
            data: {
                program,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getSocialAssistanceById = getSocialAssistanceById;
// Create social assistance program
const createSocialAssistance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const programData = req.body;
        const newProgram = yield socialAssistanceService.createSocialAssistance(programData);
        res.status(201).json({
            status: 'success',
            message: 'Social assistance program created successfully',
            data: {
                program: newProgram,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createSocialAssistance = createSocialAssistance;
// Update social assistance program
const updateSocialAssistance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const assistanceId = parseInt(req.params.id);
        if (isNaN(assistanceId)) {
            throw new error_middleware_1.ApiError('Invalid social assistance ID', 400);
        }
        const programData = req.body;
        const updatedProgram = yield socialAssistanceService.updateSocialAssistance(assistanceId, programData);
        res.status(200).json({
            status: 'success',
            message: 'Social assistance program updated successfully',
            data: {
                program: updatedProgram,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateSocialAssistance = updateSocialAssistance;
// Delete social assistance program
const deleteSocialAssistance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const assistanceId = parseInt(req.params.id);
        if (isNaN(assistanceId)) {
            throw new error_middleware_1.ApiError('Invalid social assistance ID', 400);
        }
        yield socialAssistanceService.deleteSocialAssistance(assistanceId);
        res.status(200).json({
            status: 'success',
            message: 'Social assistance program deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteSocialAssistance = deleteSocialAssistance;
// Get recipients of a social assistance program
const getSocialAssistanceRecipients = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const assistanceId = parseInt(req.params.id);
        if (isNaN(assistanceId)) {
            throw new error_middleware_1.ApiError('Invalid social assistance ID', 400);
        }
        const { page = '1', limit = '10', verified, rtNumber } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        let parsedVerified;
        if (verified !== undefined) {
            parsedVerified = verified === 'true';
        }
        const result = yield socialAssistanceService.getSocialAssistanceRecipients(assistanceId, {
            page: pageNum,
            limit: limitNum,
            verified: parsedVerified,
            rtNumber: rtNumber
        }, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            results: result.recipients.length,
            totalPages: result.totalPages,
            currentPage: pageNum,
            totalItems: result.totalItems,
            data: {
                recipients: result.recipients,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getSocialAssistanceRecipients = getSocialAssistanceRecipients;
// Add recipient to a social assistance program
const addRecipient = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const assistanceId = parseInt(req.params.id);
        if (isNaN(assistanceId)) {
            throw new error_middleware_1.ApiError('Invalid social assistance ID', 400);
        }
        const { residentId, notes } = req.body;
        if (!residentId) {
            throw new error_middleware_1.ApiError('Resident ID is required', 400);
        }
        const recipient = yield socialAssistanceService.addSocialAssistanceRecipient(assistanceId, { residentId, notes }, {
            id: req.user.id,
            role: req.user.role,
            name: req.user.name
        });
        res.status(201).json({
            status: 'success',
            message: 'Recipient added successfully',
            data: {
                recipient,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.addRecipient = addRecipient;
// Update recipient information
const updateRecipient = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const assistanceId = parseInt(req.params.assistanceId);
        const recipientId = parseInt(req.params.recipientId);
        if (isNaN(assistanceId) || isNaN(recipientId)) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        const { notes, isVerified, receivedDate } = req.body;
        let parsedReceivedDate;
        if (receivedDate && !isNaN(Date.parse(receivedDate))) {
            parsedReceivedDate = new Date(receivedDate);
        }
        const updatedRecipient = yield socialAssistanceService.updateRecipient(recipientId, {
            notes,
            isVerified,
            receivedDate: parsedReceivedDate
        }, {
            id: req.user.id,
            role: req.user.role,
            name: req.user.email || `User ${req.user.id}`
        });
        res.status(200).json({
            status: 'success',
            message: 'Recipient updated successfully',
            data: {
                recipient: updatedRecipient,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateRecipient = updateRecipient;
// Remove recipient from program
const removeRecipient = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const assistanceId = parseInt(req.params.assistanceId);
        const recipientId = parseInt(req.params.recipientId);
        if (isNaN(assistanceId) || isNaN(recipientId)) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        yield socialAssistanceService.removeRecipient(recipientId);
        res.status(200).json({
            status: 'success',
            message: 'Recipient removed successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.removeRecipient = removeRecipient;
// Update social assistance status
const updateSocialAssistanceStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const assistanceId = parseInt(req.params.id);
        if (isNaN(assistanceId)) {
            throw new error_middleware_1.ApiError('Invalid social assistance ID', 400);
        }
        const { status } = req.body;
        if (!status || !['DISIAPKAN', 'DISALURKAN', 'SELESAI'].includes(status)) {
            throw new error_middleware_1.ApiError('Invalid status', 400);
        }
        const updatedProgram = yield socialAssistanceService.updateSocialAssistance(assistanceId, { status });
        res.status(200).json({
            status: 'success',
            message: 'Social assistance status updated successfully',
            data: {
                program: updatedProgram,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateSocialAssistanceStatus = updateSocialAssistanceStatus;
// Get social assistance statistics
const getSocialAssistanceStatistics = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const statistics = yield socialAssistanceService.getSocialAssistanceStatistics({
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
exports.getSocialAssistanceStatistics = getSocialAssistanceStatistics;
// Export recipients to CSV
const exportRecipients = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const assistanceId = parseInt(req.params.id);
        if (isNaN(assistanceId)) {
            throw new error_middleware_1.ApiError('Invalid social assistance ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get program details
        const program = yield prisma.socialAssistance.findUnique({
            where: { id: assistanceId },
            select: {
                id: true,
                name: true,
                type: true,
            },
        });
        if (!program) {
            throw new error_middleware_1.ApiError('Social assistance program not found', 404);
        }
        // Get recipients with resident details
        const recipients = yield prisma.socialAssistanceRecipient.findMany({
            where: {
                socialAssistanceId: assistanceId,
            },
            include: {
                resident: {
                    select: {
                        fullName: true,
                        nik: true,
                        phoneNumber: true,
                        address: true,
                        rtNumber: true,
                        rwNumber: true,
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
            'Nama Lengkap',
            'NIK',
            'No. Telepon',
            'Alamat',
            'RT',
            'RW',
            'Status Verifikasi',
            'Tanggal Verifikasi',
            'Tanggal Diterima',
            'Catatan',
            'Tanggal Daftar',
        ].join(',');
        const csvRows = recipients.map((recipient, index) => {
            const resident = recipient.resident;
            return [
                index + 1,
                `"${(resident === null || resident === void 0 ? void 0 : resident.fullName) || 'N/A'}"`,
                `"${(resident === null || resident === void 0 ? void 0 : resident.nik) || 'N/A'}"`,
                `"${(resident === null || resident === void 0 ? void 0 : resident.phoneNumber) || 'N/A'}"`,
                `"${(resident === null || resident === void 0 ? void 0 : resident.address) || 'N/A'}"`,
                `"${(resident === null || resident === void 0 ? void 0 : resident.rtNumber) || 'N/A'}"`,
                `"${(resident === null || resident === void 0 ? void 0 : resident.rwNumber) || 'N/A'}"`,
                `"${recipient.isVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}"`,
                `"${recipient.verifiedAt ? new Date(recipient.verifiedAt).toLocaleDateString('id-ID') : 'N/A'}"`,
                `"${recipient.receivedDate ? new Date(recipient.receivedDate).toLocaleDateString('id-ID') : 'N/A'}"`,
                `"${recipient.notes || 'N/A'}"`,
                `"${new Date(recipient.createdAt).toLocaleDateString('id-ID')}"`,
            ].join(',');
        });
        const csvContent = [csvHeader, ...csvRows].join('\n');
        // Set headers for file download
        const fileName = `penerima-${program.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
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
exports.exportRecipients = exportRecipients;
// Check resident eligibility for social assistance
const checkResidentEligibility = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residentId = parseInt(req.params.residentId);
        if (isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get resident data
        const resident = yield prisma.resident.findUnique({
            where: { id: residentId },
            include: {
                socialAssistances: true
            }
        });
        if (!resident) {
            throw new error_middleware_1.ApiError('Resident not found', 404);
        }
        // Get active social assistance programs
        const activePrograms = yield prisma.socialAssistance.findMany({
            where: {
                status: { in: ['DISIAPKAN', 'DISALURKAN'] },
                endDate: { gte: new Date() }
            }
        });
        // Check which programs the resident is already enrolled in
        const enrolledProgramIds = resident.socialAssistances.map(sa => sa.socialAssistanceId);
        // Filter out programs the resident is already enrolled in
        const eligiblePrograms = activePrograms.filter(program => !enrolledProgramIds.includes(program.id));
        // Return eligibility status and eligible programs
        res.status(200).json({
            status: 'success',
            data: {
                isEligible: eligiblePrograms.length > 0,
                eligiblePrograms
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.checkResidentEligibility = checkResidentEligibility;
