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
exports.removeFamilyMember = exports.addFamilyMember = exports.deleteFamily = exports.updateFamily = exports.createFamily = exports.getFamilyByKK = exports.getFamilyById = exports.getAllFamilies = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const prisma = new client_1.PrismaClient();
// Get all families with pagination and filtering
const getAllFamilies = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, search, rtNumber, rwNumber } = params;
    // Calculate pagination
    const skip = (page - 1) * limit;
    // Build where conditions
    const whereConditions = {};
    if (search) {
        whereConditions.OR = [
            { noKK: { contains: search } },
            { address: { contains: search } },
        ];
    }
    if (rtNumber) {
        whereConditions.rtNumber = rtNumber;
    }
    if (rwNumber) {
        whereConditions.rwNumber = rwNumber;
    }
    // Get families with pagination
    const families = yield prisma.family.findMany({
        where: whereConditions,
        include: {
            members: {
                select: {
                    id: true,
                    fullName: true,
                    nik: true,
                    gender: true,
                    familyRole: true,
                },
            },
        },
        skip,
        take: limit,
        orderBy: {
            noKK: 'asc',
        },
    });
    // Get total count for pagination
    const totalItems = yield prisma.family.count({
        where: whereConditions,
    });
    return {
        families,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
    };
});
exports.getAllFamilies = getAllFamilies;
// Get family by ID
const getFamilyById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const family = yield prisma.family.findUnique({
        where: { id },
        include: {
            members: true,
        },
    });
    if (!family) {
        throw new error_middleware_1.ApiError('Family not found', 404);
    }
    return family;
});
exports.getFamilyById = getFamilyById;
// Get family by KK number
const getFamilyByKK = (noKK) => __awaiter(void 0, void 0, void 0, function* () {
    const family = yield prisma.family.findUnique({
        where: { noKK },
        include: {
            members: true,
        },
    });
    if (!family) {
        throw new error_middleware_1.ApiError('Family not found', 404);
    }
    return family;
});
exports.getFamilyByKK = getFamilyByKK;
// Create family
const createFamily = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if KK number already exists
    if (data.noKK) {
        const existingFamily = yield prisma.family.findUnique({
            where: { noKK: data.noKK },
        });
        if (existingFamily) {
            throw new error_middleware_1.ApiError('Family with this KK number already exists', 400);
        }
    }
    // Create family
    const family = yield prisma.family.create({
        data: Object.assign({}, data),
        include: {
            members: true,
        },
    });
    return family;
});
exports.createFamily = createFamily;
// Update family
const updateFamily = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if family exists
    const existingFamily = yield prisma.family.findUnique({
        where: { id },
    });
    if (!existingFamily) {
        throw new error_middleware_1.ApiError('Family not found', 404);
    }
    // Check if KK number is being changed and already exists
    if (data.noKK && data.noKK !== existingFamily.noKK) {
        const kkExists = yield prisma.family.findUnique({
            where: { noKK: data.noKK },
        });
        if (kkExists) {
            throw new error_middleware_1.ApiError('Family with this KK number already exists', 400);
        }
    }
    // Update family
    const updatedFamily = yield prisma.family.update({
        where: { id },
        data: Object.assign({}, data),
        include: {
            members: true,
        },
    });
    return updatedFamily;
});
exports.updateFamily = updateFamily;
// Delete family
const deleteFamily = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if family exists
    const existingFamily = yield prisma.family.findUnique({
        where: { id },
        include: {
            members: true,
        },
    });
    if (!existingFamily) {
        throw new error_middleware_1.ApiError('Family not found', 404);
    }
    // Check if family has members
    if (existingFamily.members.length > 0) {
        throw new error_middleware_1.ApiError('Cannot delete family with members. Remove members first.', 400);
    }
    // Delete family
    yield prisma.family.delete({
        where: { id },
    });
    return true;
});
exports.deleteFamily = deleteFamily;
// Add member to family
const addFamilyMember = (familyId, residentId, familyRole) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if family exists
    const family = yield prisma.family.findUnique({
        where: { id: familyId },
    });
    if (!family) {
        throw new error_middleware_1.ApiError('Family not found', 404);
    }
    // Check if resident exists
    const resident = yield prisma.resident.findUnique({
        where: { id: residentId },
    });
    if (!resident) {
        throw new error_middleware_1.ApiError('Resident not found', 404);
    }
    // Check if resident already belongs to a family
    if (resident.familyId) {
        throw new error_middleware_1.ApiError('Resident already belongs to a family', 400);
    }
    // Add resident to family
    const updatedResident = yield prisma.resident.update({
        where: { id: residentId },
        data: {
            familyId,
            familyRole: familyRole,
            noKK: family.noKK, // Update resident's KK number to match family
        },
        include: {
            family: true,
        },
    });
    return updatedResident;
});
exports.addFamilyMember = addFamilyMember;
// Remove member from family
const removeFamilyMember = (familyId, residentId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if family exists
    const family = yield prisma.family.findUnique({
        where: { id: familyId },
    });
    if (!family) {
        throw new error_middleware_1.ApiError('Family not found', 404);
    }
    // Check if resident exists and belongs to the family
    const resident = yield prisma.resident.findFirst({
        where: {
            id: residentId,
            familyId,
        },
    });
    if (!resident) {
        throw new error_middleware_1.ApiError('Resident not found in this family', 404);
    }
    // Remove resident from family
    const updatedResident = yield prisma.resident.update({
        where: { id: residentId },
        data: {
            familyId: null,
            familyRole: null,
        },
    });
    return updatedResident;
});
exports.removeFamilyMember = removeFamilyMember;
