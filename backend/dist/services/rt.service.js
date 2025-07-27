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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRTResidents = exports.getRTStatistics = exports.deleteRT = exports.updateRT = exports.createRT = exports.getRTByNumber = exports.getRTById = exports.getAllRTs = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// Get all RTs
const getAllRTs = (filters, userContext) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, search, includeInactive } = filters;
    const skip = (page - 1) * limit;
    // Build where clause
    const where = {};
    if (!includeInactive) {
        where.isActive = true;
    }
    if (search) {
        where.OR = [
            { number: { contains: search } },
            { name: { contains: search } },
            { chairperson: { contains: search } },
            { address: { contains: search } },
        ];
    }
    // Get total count
    const totalItems = yield prisma.rT.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    // Get RTs with resident count
    const rts = yield prisma.rT.findMany({
        where,
        skip,
        take: limit,
        include: {
            _count: {
                select: {
                    residents: true,
                    families: true,
                },
            },
        },
        orderBy: {
            number: 'asc',
        },
    });
    return {
        rts,
        totalItems,
        totalPages,
    };
});
exports.getAllRTs = getAllRTs;
// Get RT by ID
const getRTById = (rtId, userContext) => __awaiter(void 0, void 0, void 0, function* () {
    const rt = yield prisma.rT.findUnique({
        where: { id: rtId },
        include: {
            _count: {
                select: {
                    residents: true,
                    families: true,
                },
            },
        },
    });
    if (!rt) {
        throw new error_middleware_1.ApiError('RT not found', 404);
    }
    return rt;
});
exports.getRTById = getRTById;
// Get RT by number
const getRTByNumber = (number, userContext) => __awaiter(void 0, void 0, void 0, function* () {
    const rt = yield prisma.rT.findUnique({
        where: { number },
        include: {
            _count: {
                select: {
                    residents: true,
                    families: true,
                },
            },
        },
    });
    if (!rt) {
        throw new error_middleware_1.ApiError('RT not found', 404);
    }
    return rt;
});
exports.getRTByNumber = getRTByNumber;
// Create RT
const createRT = (rtData, userContext) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has permission
    if (!['RW', 'ADMIN'].includes(userContext.role)) {
        throw new error_middleware_1.ApiError('Insufficient permissions', 403);
    }
    // Check if RT number already exists
    const existingRT = yield prisma.rT.findUnique({
        where: { number: rtData.number },
    });
    if (existingRT) {
        throw new error_middleware_1.ApiError('RT with this number already exists', 400);
    }
    // Generate RT user account credentials
    const rtEmail = rtData.email || `rt${rtData.number}@smartrw.local`;
    const rtPassword = `RT${rtData.number}@2024`; // Default password
    const hashedPassword = yield bcryptjs_1.default.hash(rtPassword, 12);
    // Check if email already exists
    const existingUser = yield prisma.user.findUnique({
        where: { email: rtEmail },
    });
    if (existingUser) {
        throw new error_middleware_1.ApiError('Email already exists. Please use a different email for RT account.', 400);
    }
    // Use transaction to create both RT and User
    const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // Create RT user account
        const rtUser = yield tx.user.create({
            data: {
                email: rtEmail,
                password: hashedPassword,
                name: rtData.chairperson || `Ketua RT ${rtData.number}`,
                role: 'RT',
            },
        });
        // Create RT with user relation
        const newRT = yield tx.rT.create({
            data: {
                number: rtData.number,
                name: rtData.name,
                description: rtData.description,
                address: rtData.address,
                chairperson: rtData.chairperson,
                phoneNumber: rtData.phoneNumber,
                email: rtData.email,
                isActive: (_a = rtData.isActive) !== null && _a !== void 0 ? _a : true,
                userId: rtUser.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        residents: true,
                        families: true,
                    },
                },
            },
        });
        return { rt: newRT, credentials: { email: rtEmail, password: rtPassword } };
    }));
    return result;
});
exports.createRT = createRT;
// Update RT
const updateRT = (rtId, rtData, userContext) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has permission
    if (!['RW', 'ADMIN'].includes(userContext.role)) {
        throw new error_middleware_1.ApiError('Insufficient permissions', 403);
    }
    // Check if RT exists
    const existingRT = yield prisma.rT.findUnique({
        where: { id: rtId },
    });
    if (!existingRT) {
        throw new error_middleware_1.ApiError('RT not found', 404);
    }
    // Check if RT number already exists (if changing number)
    if (rtData.number && rtData.number !== existingRT.number) {
        const duplicateRT = yield prisma.rT.findUnique({
            where: { number: rtData.number },
        });
        if (duplicateRT) {
            throw new error_middleware_1.ApiError('RT with this number already exists', 400);
        }
    }
    const updatedRT = yield prisma.rT.update({
        where: { id: rtId },
        data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (rtData.number && { number: rtData.number })), (rtData.name !== undefined && { name: rtData.name })), (rtData.description !== undefined && { description: rtData.description })), (rtData.address !== undefined && { address: rtData.address })), (rtData.chairperson !== undefined && { chairperson: rtData.chairperson })), (rtData.phoneNumber !== undefined && { phoneNumber: rtData.phoneNumber })), (rtData.email !== undefined && { email: rtData.email })), (rtData.isActive !== undefined && { isActive: rtData.isActive })),
        include: {
            _count: {
                select: {
                    residents: true,
                    families: true,
                },
            },
        },
    });
    return updatedRT;
});
exports.updateRT = updateRT;
// Delete RT (soft delete by setting isActive to false)
const deleteRT = (rtId, userContext) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has permission
    if (!['RW', 'ADMIN'].includes(userContext.role)) {
        throw new error_middleware_1.ApiError('Insufficient permissions', 403);
    }
    // Check if RT exists
    const existingRT = yield prisma.rT.findUnique({
        where: { id: rtId },
        include: {
            _count: {
                select: {
                    residents: true,
                    families: true,
                },
            },
        },
    });
    if (!existingRT) {
        throw new error_middleware_1.ApiError('RT not found', 404);
    }
    // Check if RT has residents
    if (existingRT._count.residents > 0) {
        throw new error_middleware_1.ApiError('Cannot delete RT that has residents. Please move residents to another RT first.', 400);
    }
    // Soft delete by setting isActive to false
    yield prisma.rT.update({
        where: { id: rtId },
        data: { isActive: false },
    });
});
exports.deleteRT = deleteRT;
// Get RT statistics
const getRTStatistics = (rtId, userContext) => __awaiter(void 0, void 0, void 0, function* () {
    const rt = yield prisma.rT.findUnique({
        where: { id: rtId },
    });
    if (!rt) {
        throw new error_middleware_1.ApiError('RT not found', 404);
    }
    // Get resident statistics
    const totalResidents = yield prisma.resident.count({
        where: { rtId },
    });
    const verifiedResidents = yield prisma.resident.count({
        where: {
            rtId,
            isVerified: true,
        },
    });
    const totalFamilies = yield prisma.family.count({
        where: { rtId },
    });
    // Gender statistics
    const maleResidents = yield prisma.resident.count({
        where: {
            rtId,
            gender: 'LAKI_LAKI',
        },
    });
    const femaleResidents = yield prisma.resident.count({
        where: {
            rtId,
            gender: 'PEREMPUAN',
        },
    });
    // Age group statistics
    const now = new Date();
    const childrenCount = yield prisma.resident.count({
        where: {
            rtId,
            birthDate: {
                gte: new Date(now.getFullYear() - 17, now.getMonth(), now.getDate()),
            },
        },
    });
    const adultCount = yield prisma.resident.count({
        where: {
            rtId,
            birthDate: {
                lt: new Date(now.getFullYear() - 17, now.getMonth(), now.getDate()),
                gte: new Date(now.getFullYear() - 60, now.getMonth(), now.getDate()),
            },
        },
    });
    const elderlyCount = yield prisma.resident.count({
        where: {
            rtId,
            birthDate: {
                lt: new Date(now.getFullYear() - 60, now.getMonth(), now.getDate()),
            },
        },
    });
    return {
        rt,
        totalResidents,
        verifiedResidents,
        unverifiedResidents: totalResidents - verifiedResidents,
        totalFamilies,
        genderDistribution: {
            male: maleResidents,
            female: femaleResidents,
        },
        ageDistribution: {
            children: childrenCount,
            adults: adultCount,
            elderly: elderlyCount,
        },
    };
});
exports.getRTStatistics = getRTStatistics;
// Get residents in RT
const getRTResidents = (rtId, filters, userContext) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, search } = filters;
    const skip = (page - 1) * limit;
    // Check if RT exists
    const rt = yield prisma.rT.findUnique({
        where: { id: rtId },
    });
    if (!rt) {
        throw new error_middleware_1.ApiError('RT not found', 404);
    }
    // Build where clause
    const where = { rtId };
    if (search) {
        where.OR = [
            { fullName: { contains: search } },
            { nik: { contains: search } },
            { noKK: { contains: search } },
        ];
    }
    // Get total count
    const totalItems = yield prisma.resident.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    // Get residents
    const residents = yield prisma.resident.findMany({
        where,
        skip,
        take: limit,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            family: {
                select: {
                    id: true,
                    noKK: true,
                },
            },
        },
        orderBy: {
            fullName: 'asc',
        },
    });
    return {
        residents,
        totalItems,
        totalPages,
    };
});
exports.getRTResidents = getRTResidents;
