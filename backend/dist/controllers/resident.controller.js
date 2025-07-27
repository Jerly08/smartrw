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
exports.getResidentSocialAssistance = exports.getResidentStatistics = exports.importResidents = exports.verifyResident = exports.deleteResident = exports.updateResident = exports.createResident = exports.getResidentById = exports.getAllResidents = void 0;
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
