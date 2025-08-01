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
exports.getResidentsForRT = exports.uploadResidentDocument = exports.verifyByRT = exports.getPendingVerification = exports.getResidentSocialAssistance = exports.getResidentDocuments = exports.getResidentStatistics = exports.exportResidents = exports.importResidents = exports.verifyResident = exports.deleteResident = exports.updateResident = exports.createResident = exports.getResidentById = exports.getAllResidents = void 0;
const residentService = __importStar(require("../services/resident.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all residents
const getAllResidents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '10', search, rtNumber, rwNumber } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const result = yield residentService.getAllResidents({
            page: pageNum,
            limit: limitNum,
            search: search,
            rtNumber: rtNumber,
            rwNumber: rwNumber,
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
exports.getAllResidents = getAllResidents;
// Get resident by ID
const getResidentById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residentId = parseInt(req.params.id);
        if (isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const resident = yield residentService.getResidentById(residentId, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            data: {
                resident,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getResidentById = getResidentById;
// Create resident
const createResident = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residentData = req.body;
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const newResident = yield residentService.createResident(residentData, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(201).json({
            status: 'success',
            message: 'Resident created successfully',
            data: {
                resident: newResident,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createResident = createResident;
// Update resident
const updateResident = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residentId = parseInt(req.params.id);
        if (isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const residentData = req.body;
        const updatedResident = yield residentService.updateResident(residentId, residentData, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            message: 'Resident updated successfully',
            data: {
                resident: updatedResident,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateResident = updateResident;
// Delete resident
const deleteResident = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residentId = parseInt(req.params.id);
        if (isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        yield residentService.deleteResident(residentId, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            message: 'Resident deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteResident = deleteResident;
// Verify resident
const verifyResident = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residentId = parseInt(req.params.id);
        if (isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const verifiedResident = yield residentService.verifyResident(residentId, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            message: 'Resident verified successfully',
            data: {
                resident: verifiedResident,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.verifyResident = verifyResident;
// Import residents from CSV/Excel
const importResidents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { residents } = req.body;
        if (!Array.isArray(residents) || residents.length === 0) {
            throw new error_middleware_1.ApiError('Invalid residents data', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const result = yield residentService.importResidents(residents, {
            id: req.user.id,
            role: req.user.role
        });
        res.status(200).json({
            status: 'success',
            message: `Successfully imported ${result.success} residents with ${result.failed} failures`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.importResidents = importResidents;
// Export residents data
const exportResidents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Extract query parameters
        const { format = 'json', search, rtNumber, rwNumber, page, limit } = req.query;
        // Prepare parameters for the service
        const params = {
            search: search,
            rtNumber: rtNumber,
            rwNumber: rwNumber
        };
        const currentUser = {
            id: req.user.id,
            role: req.user.role
        };
        const residents = yield residentService.exportResidents(params, currentUser);
        if (format === 'csv') {
            // Set CSV headers
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="residents.csv"');
            // Convert to CSV format
            const csvHeaders = ['ID', 'Full Name', 'NIK', 'KK Number', 'Gender', 'Birth Date', 'Phone', 'Email', 'Address', 'RT Number', 'RW Number', 'Religion', 'Marital Status', 'Occupation', 'Education', 'Emergency Contact', 'Blood Type', 'Is Verified', 'Created At'];
            const csvRows = residents.map(resident => {
                var _a, _b, _c;
                return [
                    resident.id,
                    resident.fullName,
                    resident.nik,
                    ((_a = resident.family) === null || _a === void 0 ? void 0 : _a.noKK) || '',
                    resident.gender,
                    ((_b = resident.birthDate) === null || _b === void 0 ? void 0 : _b.toISOString().split('T')[0]) || '',
                    resident.phoneNumber || '',
                    ((_c = resident.user) === null || _c === void 0 ? void 0 : _c.email) || '',
                    resident.address,
                    resident.rtNumber,
                    resident.rwNumber || '',
                    resident.religion || '',
                    resident.maritalStatus || '',
                    resident.occupation || '',
                    resident.education || '',
                    '', // Emergency contact not available in schema
                    '', // Blood type not available in schema
                    resident.isVerified ? 'Yes' : 'No',
                    resident.createdAt.toISOString().split('T')[0]
                ];
            });
            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
                .join('\n');
            res.send(csvContent);
        }
        else {
            // Default JSON format
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="residents.json"');
            res.status(200).json({
                status: 'success',
                message: `Successfully exported ${residents.length} residents`,
                data: {
                    residents,
                    exportedAt: new Date().toISOString(),
                    totalCount: residents.length
                },
            });
        }
    }
    catch (error) {
        next(error);
    }
});
exports.exportResidents = exportResidents;
// Get resident statistics
const getResidentStatistics = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const statistics = yield residentService.getResidentStatistics({
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
exports.getResidentStatistics = getResidentStatistics;
// Get resident documents
const getResidentDocuments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residentId = parseInt(req.params.id);
        if (isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get resident to get their NIK and noKK for file naming
        const resident = yield prisma.resident.findUnique({
            where: { id: residentId }
        });
        if (!resident) {
            throw new error_middleware_1.ApiError('Resident not found', 404);
        }
        const fs = require('fs');
        const path = require('path');
        // Check if files actually exist on disk
        const uploadsPath = path.join(__dirname, '../../uploads/residents');
        const ktpFilename = `ktp_${resident.nik}.jpg`;
        const kkFilename = `kk_${resident.noKK}.jpg`;
        const ktpPath = path.join(uploadsPath, ktpFilename);
        const kkPath = path.join(uploadsPath, kkFilename);
        const documents = [];
        // Check KTP file
        if (fs.existsSync(ktpPath)) {
            documents.push({
                id: 1,
                type: 'KTP',
                filename: ktpFilename,
                uploadedAt: new Date().toISOString(),
                status: 'uploaded',
                fileUrl: `/api/uploads/residents/${ktpFilename}`
            });
        }
        else {
            documents.push({
                id: 1,
                type: 'KTP',
                filename: ktpFilename,
                uploadedAt: null,
                status: 'not_uploaded',
                fileUrl: null
            });
        }
        // Check KK file
        if (fs.existsSync(kkPath)) {
            documents.push({
                id: 2,
                type: 'KK',
                filename: kkFilename,
                uploadedAt: new Date().toISOString(),
                status: 'uploaded',
                fileUrl: `/api/uploads/residents/${kkFilename}`
            });
        }
        else {
            documents.push({
                id: 2,
                type: 'KK',
                filename: kkFilename,
                uploadedAt: null,
                status: 'not_uploaded',
                fileUrl: null
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                documents
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getResidentDocuments = getResidentDocuments;
// Get resident's social assistance history
const getResidentSocialAssistance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residentId = parseInt(req.params.id);
        if (isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get all social assistance programs where this resident is a recipient
        const assistanceHistory = yield prisma.socialAssistanceRecipient.findMany({
            where: {
                residentId: residentId
            },
            include: {
                socialAssistance: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({
            status: 'success',
            data: {
                assistanceHistory
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getResidentSocialAssistance = getResidentSocialAssistance;
// Get residents pending verification for RT
const getPendingVerification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const rtUserId = req.user.id;
        const residents = yield residentService.getResidentsPendingVerification(rtUserId);
        res.status(200).json({
            status: 'success',
            data: residents,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getPendingVerification = getPendingVerification;
// Verify resident by RT
const verifyByRT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const residentId = parseInt(req.params.id);
        if (isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        const rtUserId = req.user.id;
        const verifiedResident = yield residentService.verifyResidentByRT(residentId, rtUserId);
        res.status(200).json({
            status: 'success',
            message: 'Resident verified successfully',
            data: verifiedResident,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.verifyByRT = verifyByRT;
// Upload document for resident
const uploadResidentDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residentId = parseInt(req.params.id);
        if (isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        if (!req.file) {
            throw new error_middleware_1.ApiError('No file uploaded', 400);
        }
        // Get resident to ensure they exist
        const resident = yield prisma.resident.findUnique({
            where: { id: residentId }
        });
        if (!resident) {
            throw new error_middleware_1.ApiError('Resident not found', 404);
        }
        const { docType } = req.body;
        if (!docType || !['ktp', 'kk'].includes(docType.toLowerCase())) {
            throw new error_middleware_1.ApiError('Document type is required and must be either "ktp" or "kk"', 400);
        }
        // File was already saved by multer middleware with correct naming
        const fileUrl = `/api/uploads/residents/${req.file.filename}`;
        res.status(200).json({
            status: 'success',
            message: 'Document uploaded successfully',
            data: {
                filename: req.file.filename,
                fileUrl: fileUrl,
                docType: docType,
                uploadedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.uploadResidentDocument = uploadResidentDocument;
// Get residents for specific RT - used in RT dashboard
const getResidentsForRT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { page = '1', limit = '10', search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        const rtUserId = req.user.id;
        const result = yield residentService.getResidentsForRT(rtUserId, {
            page: pageNum,
            limit: limitNum,
            search: search,
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
exports.getResidentsForRT = getResidentsForRT;
