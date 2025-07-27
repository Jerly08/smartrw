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
exports.checkVerificationAccess = exports.checkRecipientAccess = exports.checkSocialAssistanceAccess = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("./error.middleware");
const prisma = new client_1.PrismaClient();
// Check if user can access a social assistance program
const checkSocialAssistanceAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const assistanceId = parseInt(req.params.id);
        if (isNaN(assistanceId)) {
            throw new error_middleware_1.ApiError('Invalid social assistance ID', 400);
        }
        // Admin and RW have full access
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // Check if the assistance program exists
        const assistance = yield prisma.socialAssistance.findUnique({
            where: { id: assistanceId },
        });
        if (!assistance) {
            throw new error_middleware_1.ApiError('Social assistance program not found', 404);
        }
        // All roles can view published assistance programs
        if (req.method === 'GET') {
            return next();
        }
        // Only Admin and RW can modify assistance programs (handled by the authorize middleware)
        throw new error_middleware_1.ApiError('You do not have permission to modify this resource', 403);
    }
    catch (error) {
        next(error);
    }
});
exports.checkSocialAssistanceAccess = checkSocialAssistanceAccess;
// Check if user can access a recipient
const checkRecipientAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const assistanceId = parseInt(req.params.assistanceId);
        const recipientId = parseInt(req.params.recipientId);
        if (isNaN(assistanceId) || isNaN(recipientId)) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        // Admin and RW have full access
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // Check if the recipient record exists
        const recipient = yield prisma.socialAssistanceRecipient.findFirst({
            where: {
                id: recipientId,
                socialAssistanceId: assistanceId
            },
            include: {
                resident: true
            }
        });
        if (!recipient) {
            throw new error_middleware_1.ApiError('Recipient record not found', 404);
        }
        if (req.user.role === 'RT') {
            // Get RT's assigned area
            const rtResident = yield prisma.resident.findFirst({
                where: { userId: req.user.id },
            });
            if (!rtResident) {
                throw new error_middleware_1.ApiError('RT profile not found', 404);
            }
            // RT can only access/verify recipients in their RT
            if (recipient.resident.rtNumber === rtResident.rtNumber &&
                recipient.resident.rwNumber === rtResident.rwNumber) {
                return next();
            }
            throw new error_middleware_1.ApiError('You can only access recipients in your RT', 403);
        }
        else if (req.user.role === 'WARGA') {
            // Warga can only view their own assistance records
            const resident = yield prisma.resident.findFirst({
                where: { userId: req.user.id },
            });
            if (!resident) {
                throw new error_middleware_1.ApiError('Resident profile not found', 404);
            }
            if (recipient.residentId === resident.id) {
                // Warga can only view, not modify
                if (req.method === 'GET') {
                    return next();
                }
            }
            throw new error_middleware_1.ApiError('You can only view your own assistance records', 403);
        }
        throw new error_middleware_1.ApiError('You do not have permission to access this resource', 403);
    }
    catch (error) {
        next(error);
    }
});
exports.checkRecipientAccess = checkRecipientAccess;
// Check if user can verify recipients (Admin, RW, or RT for their area)
const checkVerificationAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const assistanceId = parseInt(req.params.assistanceId);
        const recipientId = parseInt(req.params.recipientId);
        if (isNaN(assistanceId) || isNaN(recipientId)) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        // Admin and RW have full access
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        if (req.user.role === 'RT') {
            // Get recipient's details
            const recipient = yield prisma.socialAssistanceRecipient.findFirst({
                where: {
                    id: recipientId,
                    socialAssistanceId: assistanceId
                },
                include: {
                    resident: true
                }
            });
            if (!recipient) {
                throw new error_middleware_1.ApiError('Recipient record not found', 404);
            }
            // Get RT's assigned area
            const rtResident = yield prisma.resident.findFirst({
                where: { userId: req.user.id },
            });
            if (!rtResident) {
                throw new error_middleware_1.ApiError('RT profile not found', 404);
            }
            // RT can only verify recipients in their RT
            if (recipient.resident.rtNumber === rtResident.rtNumber &&
                recipient.resident.rwNumber === rtResident.rwNumber) {
                return next();
            }
        }
        throw new error_middleware_1.ApiError('You do not have permission to verify this recipient', 403);
    }
    catch (error) {
        next(error);
    }
});
exports.checkVerificationAccess = checkVerificationAccess;
