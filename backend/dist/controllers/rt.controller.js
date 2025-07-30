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
exports.getRTResidents = exports.getRTStatistics = exports.deleteRT = exports.updateRT = exports.createRT = exports.getRTByNumber = exports.getRTById = exports.getAllRTs = void 0;
const rtService = __importStar(require("../services/rt.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const rt_schema_1 = require("../schemas/rt.schema");
const zod_1 = require("zod");
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
