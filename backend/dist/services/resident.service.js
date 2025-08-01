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
exports.verifyResidentByRT = exports.getResidentsForRT = exports.getResidentsPendingVerification = exports.getResidentStatistics = exports.exportResidents = exports.importResidents = exports.verifyResident = exports.deleteResident = exports.updateResident = exports.createResident = exports.getResidentById = exports.getAllResidents = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const helpers_1 = require("../utils/helpers");
const prisma = new client_1.PrismaClient();
// Get all residents with pagination and filtering
const getAllResidents = (params, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, search, rtNumber, rwNumber } = params;
    // Calculate pagination
    const skip = (page - 1) * limit;
    // Build where conditions
    const whereConditions = {};
    if (search) {
        whereConditions.OR = [
            { fullName: { contains: search } },
            { nik: { contains: search } },
            { noKK: { contains: search } },
        ];
    }
    // Apply role-based filtering
    if (currentUser.role === 'RT') {
        // RT can only see residents in their RT
        // First, get the RT's resident record to find their RT number
        const rtResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id },
        });
        if (!rtResident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        whereConditions.rtNumber = rtResident.rtNumber;
        whereConditions.rwNumber = rtResident.rwNumber;
    }
    else if (currentUser.role === 'WARGA') {
        // Warga can only see their own record and family members
        const wargaResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id },
            include: { family: true },
        });
        if (!wargaResident) {
            throw new error_middleware_1.ApiError('Resident profile not found', 404);
        }
        // If warga has family, they can see family members, otherwise just themselves
        if (wargaResident.familyId) {
            whereConditions.OR = [
                { id: wargaResident.id },
                { familyId: wargaResident.familyId },
            ];
        }
        else {
            whereConditions.id = wargaResident.id;
        }
    }
    else {
        // Admin and RW can see all residents
        // Apply optional filters if provided
        if (rtNumber) {
            whereConditions.rtNumber = rtNumber;
        }
        if (rwNumber) {
            whereConditions.rwNumber = rwNumber;
        }
    }
    // Get residents with pagination
    const residents = yield prisma.resident.findMany({
        where: whereConditions,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
            family: true,
        },
        skip,
        take: limit,
        orderBy: {
            fullName: 'asc',
        },
    });
    // Get total count for pagination
    const totalItems = yield prisma.resident.count({
        where: whereConditions,
    });
    return {
        residents,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
    };
});
exports.getAllResidents = getAllResidents;
// Get resident by ID
const getResidentById = (id, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has permission to view this resident
    const canAccess = yield canAccessResident(id, currentUser);
    if (!canAccess) {
        throw new error_middleware_1.ApiError('You do not have permission to view this resident', 403);
    }
    const resident = yield prisma.resident.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
            family: true,
            socialAssistances: {
                include: {
                    socialAssistance: true,
                },
            },
        },
    });
    if (!resident) {
        throw new error_middleware_1.ApiError('Resident not found', 404);
    }
    return resident;
});
exports.getResidentById = getResidentById;
// Create resident
const createResident = (data, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Only RT, RW, and ADMIN can create residents
    if (!(0, helpers_1.hasPermission)(currentUser.role, 'RT')) {
        throw new error_middleware_1.ApiError('You do not have permission to create residents', 403);
    }
    // Check if NIK already exists
    if (data.nik) {
        const existingResident = yield prisma.resident.findUnique({
            where: { nik: data.nik },
        });
        if (existingResident) {
            throw new error_middleware_1.ApiError('Resident with this NIK already exists', 400);
        }
    }
    // If RT is creating, restrict to their RT
    if (currentUser.role === 'RT') {
        const rtResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id },
        });
        if (!rtResident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        // Force the RT and RW numbers to match the RT's own values
        data.rtNumber = rtResident.rtNumber;
        data.rwNumber = rtResident.rwNumber;
    }
    // Create resident
    const resident = yield prisma.resident.create({
        data: Object.assign({}, data),
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
            family: true,
        },
    });
    // Create notifications for RT users
    yield createResidentVerificationNotificationsForRT(resident);
    return resident;
});
exports.createResident = createResident;
// Update resident
const updateResident = (id, data, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has permission to update this resident
    const canAccess = yield canAccessResident(id, currentUser);
    if (!canAccess) {
        throw new error_middleware_1.ApiError('You do not have permission to update this resident', 403);
    }
    // Check if resident exists
    const existingResident = yield prisma.resident.findUnique({
        where: { id },
    });
    if (!existingResident) {
        throw new error_middleware_1.ApiError('Resident not found', 404);
    }
    // Check if NIK is being changed and already exists
    if (data.nik && data.nik !== existingResident.nik) {
        const nikExists = yield prisma.resident.findUnique({
            where: { nik: data.nik },
        });
        if (nikExists) {
            throw new error_middleware_1.ApiError('Resident with this NIK already exists', 400);
        }
    }
    // If RT is updating, ensure they can't change RT/RW numbers
    if (currentUser.role === 'RT') {
        const rtResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id },
        });
        if (!rtResident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        // Ensure RT can't change RT/RW numbers
        data.rtNumber = existingResident.rtNumber;
        data.rwNumber = existingResident.rwNumber;
    }
    // Update resident
    const updatedResident = yield prisma.resident.update({
        where: { id },
        data: Object.assign({}, data),
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
            family: true,
        },
    });
    return updatedResident;
});
exports.updateResident = updateResident;
// Delete resident
const deleteResident = (id, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Only RW and ADMIN can delete residents
    if (!(0, helpers_1.hasPermission)(currentUser.role, 'RW')) {
        throw new error_middleware_1.ApiError('You do not have permission to delete residents', 403);
    }
    // Check if resident exists
    const existingResident = yield prisma.resident.findUnique({
        where: { id },
    });
    if (!existingResident) {
        throw new error_middleware_1.ApiError('Resident not found', 404);
    }
    // Delete resident
    yield prisma.resident.delete({
        where: { id },
    });
    return true;
});
exports.deleteResident = deleteResident;
// Verify resident
const verifyResident = (id, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if resident exists
    const existingResident = yield prisma.resident.findUnique({
        where: { id },
    });
    if (!existingResident) {
        throw new error_middleware_1.ApiError('Resident not found', 404);
    }
    // Check if verifier has permission (only RT, RW, or ADMIN can verify)
    if (!(0, helpers_1.hasPermission)(currentUser.role, 'RT')) {
        throw new error_middleware_1.ApiError('You do not have permission to verify residents', 403);
    }
    // If RT is verifying, ensure resident belongs to their RT
    if (currentUser.role === 'RT') {
        const rtResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id },
        });
        if (!rtResident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        if (existingResident.rtNumber !== rtResident.rtNumber ||
            existingResident.rwNumber !== rtResident.rwNumber) {
            throw new error_middleware_1.ApiError('You can only verify residents in your RT', 403);
        }
    }
    // Get verifier name
    const verifier = yield prisma.user.findUnique({
        where: { id: currentUser.id },
    });
    if (!verifier) {
        throw new error_middleware_1.ApiError('Verifier not found', 404);
    }
    // Update resident
    const verifiedResident = yield prisma.resident.update({
        where: { id },
        data: {
            isVerified: true,
            verifiedBy: verifier.name,
            verifiedAt: new Date(),
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
            family: true,
        },
    });
    return verifiedResident;
});
exports.verifyResident = verifyResident;
// Import residents from CSV/Excel
const importResidents = (residents, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    // Only RT, RW, and ADMIN can import residents
    if (!(0, helpers_1.hasPermission)(currentUser.role, 'RT')) {
        throw new error_middleware_1.ApiError('You do not have permission to import residents', 403);
    }
    // If RT is importing, restrict to their RT
    if (currentUser.role === 'RT') {
        const rtResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id },
        });
        if (!rtResident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        // Force all imported residents to have the RT's RT/RW numbers
        residents = residents.map(resident => (Object.assign(Object.assign({}, resident), { rtNumber: rtResident.rtNumber, rwNumber: rtResident.rwNumber })));
    }
    // Process each resident
    const results = {
        success: 0,
        failed: 0,
        errors: [],
    };
    for (const residentData of residents) {
        try {
            // Check if NIK already exists
            if (residentData.nik) {
                const existingResident = yield prisma.resident.findUnique({
                    where: { nik: residentData.nik },
                });
                if (existingResident) {
                    results.failed++;
                    results.errors.push(`NIK ${residentData.nik} already exists`);
                    continue;
                }
            }
            // Create resident
            yield prisma.resident.create({
                data: Object.assign({}, residentData),
            });
            results.success++;
        }
        catch (error) {
            results.failed++;
            results.errors.push(`Error creating resident: ${error.message}`);
        }
    }
    return results;
});
exports.importResidents = importResidents;
// Export residents to CSV
const exportResidents = (params, currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, rtNumber, rwNumber } = params;
    // Build where conditions
    const whereConditions = {};
    if (search) {
        whereConditions.OR = [
            { fullName: { contains: search } },
            { nik: { contains: search } },
            { noKK: { contains: search } },
        ];
    }
    // Apply role-based filtering
    if (currentUser.role === 'RT') {
        // RT can only export residents in their RT
        const rtResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id },
        });
        if (!rtResident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        whereConditions.rtNumber = rtResident.rtNumber;
        whereConditions.rwNumber = rtResident.rwNumber;
    }
    else if (currentUser.role === 'WARGA') {
        // Warga can only export their own record and family members
        const wargaResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id },
            include: { family: true },
        });
        if (!wargaResident) {
            throw new error_middleware_1.ApiError('Resident profile not found', 404);
        }
        // If warga has family, they can export family members, otherwise just themselves
        if (wargaResident.familyId) {
            whereConditions.OR = [
                { id: wargaResident.id },
                { familyId: wargaResident.familyId },
            ];
        }
        else {
            whereConditions.id = wargaResident.id;
        }
    }
    else {
        // Admin and RW can export all residents
        // Apply optional filters if provided
        if (rtNumber) {
            whereConditions.rtNumber = rtNumber;
        }
        if (rwNumber) {
            whereConditions.rwNumber = rwNumber;
        }
    }
    // Get all residents without pagination for export
    const residents = yield prisma.resident.findMany({
        where: whereConditions,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
            family: true,
        },
        orderBy: {
            fullName: 'asc',
        },
    });
    return residents;
});
exports.exportResidents = exportResidents;
// Get resident statistics
const getResidentStatistics = (currentUser) => __awaiter(void 0, void 0, void 0, function* () {
    let whereConditions = {};
    // Apply role-based filtering
    if (currentUser.role === 'RT') {
        // RT can only see statistics for their RT
        const rtResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id },
        });
        if (!rtResident) {
            throw new error_middleware_1.ApiError('RT profile not found', 404);
        }
        whereConditions.rtNumber = rtResident.rtNumber;
        whereConditions.rwNumber = rtResident.rwNumber;
    }
    else if (currentUser.role === 'WARGA') {
        // Warga can only see statistics for their family
        const wargaResident = yield prisma.resident.findFirst({
            where: { userId: currentUser.id },
        });
        if (!wargaResident) {
            throw new error_middleware_1.ApiError('Resident profile not found', 404);
        }
        if (wargaResident.familyId) {
            whereConditions.familyId = wargaResident.familyId;
        }
        else {
            whereConditions.id = wargaResident.id;
        }
    }
    // Get total residents
    const totalResidents = yield prisma.resident.count({
        where: whereConditions,
    });
    // Get gender distribution
    const maleCount = yield prisma.resident.count({
        where: Object.assign(Object.assign({}, whereConditions), { gender: 'LAKI_LAKI' }),
    });
    const femaleCount = yield prisma.resident.count({
        where: Object.assign(Object.assign({}, whereConditions), { gender: 'PEREMPUAN' }),
    });
    // Get age distribution
    const now = new Date();
    const ageRanges = [
        { min: 0, max: 5 },
        { min: 6, max: 17 },
        { min: 18, max: 30 },
        { min: 31, max: 45 },
        { min: 46, max: 60 },
        { min: 61, max: 200 },
    ];
    const ageDistribution = [];
    for (const range of ageRanges) {
        const minDate = new Date(now);
        minDate.setFullYear(now.getFullYear() - range.max - 1);
        minDate.setDate(minDate.getDate() + 1);
        const maxDate = new Date(now);
        maxDate.setFullYear(now.getFullYear() - range.min);
        const count = yield prisma.resident.count({
            where: Object.assign(Object.assign({}, whereConditions), { birthDate: {
                    gte: minDate,
                    lte: maxDate,
                } }),
        });
        ageDistribution.push({
            range: `${range.min}-${range.max === 200 ? '>' : range.max}`,
            count,
        });
    }
    // Get education distribution
    const educationDistribution = [];
    const educationLevels = ['TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'];
    for (const level of educationLevels) {
        const count = yield prisma.resident.count({
            where: Object.assign(Object.assign({}, whereConditions), { education: level }),
        });
        educationDistribution.push({
            level,
            count,
        });
    }
    // Get verification status
    const verifiedCount = yield prisma.resident.count({
        where: Object.assign(Object.assign({}, whereConditions), { isVerified: true }),
    });
    const unverifiedCount = totalResidents - verifiedCount;
    return {
        totalResidents,
        genderDistribution: {
            male: maleCount,
            female: femaleCount,
        },
        ageDistribution,
        educationDistribution,
        verificationStatus: {
            verified: verifiedCount,
            unverified: unverifiedCount,
        },
    };
});
exports.getResidentStatistics = getResidentStatistics;
// Helper function to check if a user can access a specific resident
function canAccessResident(residentId, currentUser) {
    return __awaiter(this, void 0, void 0, function* () {
        // Admin and RW can access all residents
        if ((0, helpers_1.hasPermission)(currentUser.role, 'RW')) {
            return true;
        }
        const targetResident = yield prisma.resident.findUnique({
            where: { id: residentId },
            include: { family: true },
        });
        if (!targetResident) {
            return false;
        }
        if (currentUser.role === 'RT') {
            // RT can access residents in their RT
            const rtResident = yield prisma.resident.findFirst({
                where: { userId: currentUser.id },
            });
            if (!rtResident) {
                return false;
            }
            return targetResident.rtNumber === rtResident.rtNumber &&
                targetResident.rwNumber === rtResident.rwNumber;
        }
        else if (currentUser.role === 'WARGA') {
            // Warga can access their own record and family members
            const wargaResident = yield prisma.resident.findFirst({
                where: { userId: currentUser.id },
            });
            if (!wargaResident) {
                return false;
            }
            // Own record
            if (wargaResident.id === targetResident.id) {
                return true;
            }
            // Family member
            return wargaResident.familyId !== null &&
                wargaResident.familyId === targetResident.familyId;
        }
        return false;
    });
}
// Get residents pending verification for RT
const getResidentsPendingVerification = (rtUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // First, get the RT user information with RT relationship
    const rtUser = yield prisma.user.findUnique({
        where: { id: rtUserId },
        include: {
            rt: true,
            resident: true
        },
    });
    if (!rtUser || rtUser.role !== 'RT') {
        throw new error_middleware_1.ApiError('Only RT can access pending verifications', 403);
    }
    // RT user should have RT relationship OR resident profile with rtId
    let rtId = null;
    let rtNumber = null;
    if (rtUser.rt) {
        // RT user is directly associated with RT table
        rtId = rtUser.rt.id;
        rtNumber = rtUser.rt.number;
    }
    else if ((_a = rtUser.resident) === null || _a === void 0 ? void 0 : _a.rtId) {
        // RT user has resident profile with rtId
        rtId = rtUser.resident.rtId;
        rtNumber = rtUser.resident.rtNumber;
    }
    else {
        throw new error_middleware_1.ApiError('RT profile not found - user is not associated with any RT', 404);
    }
    // Get residents in RT's area that are not verified yet
    const residents = yield prisma.resident.findMany({
        where: {
            rtId: rtId,
            isVerified: false,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            rt: {
                select: {
                    id: true,
                    number: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return residents;
});
exports.getResidentsPendingVerification = getResidentsPendingVerification;
// Get all residents for RT - only those registered to specific RT
const getResidentsForRT = (rtUserId, params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { page, limit, search } = params;
    // Get RT user information
    const rtUser = yield prisma.user.findUnique({
        where: { id: rtUserId },
        include: {
            rt: true,
            resident: true
        },
    });
    if (!rtUser || rtUser.role !== 'RT') {
        throw new error_middleware_1.ApiError('Only RT can access RT residents', 403);
    }
    // Get RT ID
    let rtId = null;
    if (rtUser.rt) {
        rtId = rtUser.rt.id;
    }
    else if ((_a = rtUser.resident) === null || _a === void 0 ? void 0 : _a.rtId) {
        rtId = rtUser.resident.rtId;
    }
    else {
        throw new error_middleware_1.ApiError('RT profile not found', 404);
    }
    // Calculate pagination
    const skip = (page - 1) * limit;
    // Build where conditions - only residents who chose this RT
    const whereConditions = {
        rtId: rtId, // This ensures only residents who chose this RT are shown
    };
    if (search) {
        whereConditions.OR = [
            { fullName: { contains: search } },
            { nik: { contains: search } },
            { noKK: { contains: search } },
        ];
    }
    // Get residents with pagination
    const residents = yield prisma.resident.findMany({
        where: whereConditions,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
            family: true,
            rt: {
                select: {
                    id: true,
                    number: true,
                    name: true,
                },
            },
        },
        skip,
        take: limit,
        orderBy: {
            createdAt: 'desc', // Show newest registrations first
        },
    });
    // Get total count for pagination
    const totalItems = yield prisma.resident.count({
        where: whereConditions,
    });
    return {
        residents,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
    };
});
exports.getResidentsForRT = getResidentsForRT;
// Verify resident by RT
const verifyResidentByRT = (residentId, rtUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Get RT user information with RT relationship
    const rtUser = yield prisma.user.findUnique({
        where: { id: rtUserId },
        include: {
            rt: true,
            resident: true
        },
    });
    if (!rtUser || rtUser.role !== 'RT') {
        throw new error_middleware_1.ApiError('Only RT can verify residents', 403);
    }
    // RT user should have RT relationship OR resident profile with rtId
    let rtId = null;
    let rtNumber = null;
    if (rtUser.rt) {
        // RT user is directly associated with RT table
        rtId = rtUser.rt.id;
        rtNumber = rtUser.rt.number;
    }
    else if ((_a = rtUser.resident) === null || _a === void 0 ? void 0 : _a.rtId) {
        // RT user has resident profile with rtId
        rtId = rtUser.resident.rtId;
        rtNumber = rtUser.resident.rtNumber;
    }
    else {
        throw new error_middleware_1.ApiError('RT profile not found - user is not associated with any RT', 404);
    }
    // Get the resident to be verified
    const resident = yield prisma.resident.findUnique({
        where: { id: residentId },
        include: { rt: true },
    });
    if (!resident) {
        throw new error_middleware_1.ApiError('Resident not found', 404);
    }
    // Check if RT user is authorized to verify this resident (same RT)
    if (rtId !== resident.rtId) {
        throw new error_middleware_1.ApiError('RT can only verify residents in their own RT area', 403);
    }
    // Check if RT information is available
    if (!resident.rt) {
        throw new error_middleware_1.ApiError('RT information not found for resident', 404);
    }
    // Update resident verification status
    const updatedResident = yield prisma.resident.update({
        where: { id: residentId },
        data: {
            isVerified: true,
            verifiedBy: `RT ${rtNumber} - ${rtUser.name}`,
            verifiedAt: new Date(),
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            rt: {
                select: {
                    id: true,
                    number: true,
                    name: true,
                },
            },
        },
    });
    return updatedResident;
});
exports.verifyResidentByRT = verifyResidentByRT;
// Helper function to create notifications for RT users when new residents need verification
function createResidentVerificationNotificationsForRT(resident) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { rtNumber, rwNumber } = resident;
            // Get all RT users for the resident's RT
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
                        type: 'SYSTEM',
                        title: 'Verifikasi Warga Baru',
                        message: `Warga baru ${resident.fullName} memerlukan verifikasi Anda`,
                        priority: 'HIGH',
                        data: JSON.stringify({
                            residentId: resident.id,
                            residentName: resident.fullName,
                            residentNik: resident.nik,
                            residentAddress: resident.address,
                        }),
                    },
                });
            }
        }
        catch (error) {
            console.error('Error creating resident verification notifications for RT:', error);
        }
    });
}
