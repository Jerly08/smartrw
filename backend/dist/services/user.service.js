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
exports.deleteUser = exports.getRTListForRW = exports.linkUserToResident = exports.updateUserRole = exports.updateUser = exports.getUserById = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const prisma = new client_1.PrismaClient();
// Get all users
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            resident: {
                select: {
                    id: true,
                    fullName: true,
                    rtNumber: true,
                    rwNumber: true,
                },
            },
        },
    });
    return users;
});
exports.getAllUsers = getAllUsers;
// Get user by ID
const getUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            resident: true,
        },
    });
    if (!user) {
        throw new error_middleware_1.ApiError('User not found', 404);
    }
    return user;
});
exports.getUserById = getUserById;
// Update user
const updateUser = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists
    const existingUser = yield prisma.user.findUnique({
        where: { id: userId },
    });
    if (!existingUser) {
        throw new error_middleware_1.ApiError('User not found', 404);
    }
    // Check if email is already in use by another user
    if (data.email && data.email !== existingUser.email) {
        const emailExists = yield prisma.user.findUnique({
            where: { email: data.email },
        });
        if (emailExists) {
            throw new error_middleware_1.ApiError('Email already in use', 400);
        }
    }
    // Update user
    const updatedUser = yield prisma.user.update({
        where: { id: userId },
        data: {
            name: data.name,
            email: data.email,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return updatedUser;
});
exports.updateUser = updateUser;
// Update user role (admin only)
const updateUserRole = (userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists
    const existingUser = yield prisma.user.findUnique({
        where: { id: userId },
    });
    if (!existingUser) {
        throw new error_middleware_1.ApiError('User not found', 404);
    }
    // Update user role
    const updatedUser = yield prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return updatedUser;
});
exports.updateUserRole = updateUserRole;
// Link user to resident
const linkUserToResident = (userId, residentId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists
    const existingUser = yield prisma.user.findUnique({
        where: { id: userId },
        include: { resident: true },
    });
    if (!existingUser) {
        throw new error_middleware_1.ApiError('User not found', 404);
    }
    // Check if user is already linked to a resident
    if (existingUser.resident) {
        throw new error_middleware_1.ApiError('User is already linked to a resident', 400);
    }
    // Check if resident exists
    const existingResident = yield prisma.resident.findUnique({
        where: { id: residentId },
        include: { user: true },
    });
    if (!existingResident) {
        throw new error_middleware_1.ApiError('Resident not found', 404);
    }
    // Check if resident is already linked to a user
    if (existingResident.user) {
        throw new error_middleware_1.ApiError('Resident is already linked to a user', 400);
    }
    // Link user to resident
    yield prisma.resident.update({
        where: { id: residentId },
        data: { userId },
    });
    // Get updated user with resident info
    const updatedUser = yield prisma.user.findUnique({
        where: { id: userId },
        include: { resident: true },
    });
    return updatedUser;
});
exports.linkUserToResident = linkUserToResident;
// Get RT list for RW user
const getRTListForRW = (user) => __awaiter(void 0, void 0, void 0, function* () {
    // Get user's resident info to find their RW
    const userWithResident = yield prisma.user.findUnique({
        where: { id: user.id },
        include: { resident: true },
    });
    if (!userWithResident || !userWithResident.resident) {
        throw new error_middleware_1.ApiError('User is not linked to a resident', 400);
    }
    const rwNumber = userWithResident.resident.rwNumber;
    // Get distinct RT numbers for the RW
    const distinctRTs = yield prisma.resident.findMany({
        where: {
            rwNumber: rwNumber,
        },
        select: {
            rtNumber: true,
        },
        distinct: ['rtNumber'],
        orderBy: {
            rtNumber: 'asc',
        },
    });
    // Filter out null/undefined RT numbers and transform to the expected format
    const rtList = distinctRTs
        .filter(rt => rt.rtNumber != null)
        .map((rt, index) => ({
        id: index + 1,
        number: rt.rtNumber,
    }));
    return rtList;
});
exports.getRTListForRW = getRTListForRW;
// Delete user
const deleteUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists
    const existingUser = yield prisma.user.findUnique({
        where: { id: userId },
    });
    if (!existingUser) {
        throw new error_middleware_1.ApiError('User not found', 404);
    }
    // Delete user
    yield prisma.user.delete({
        where: { id: userId },
    });
    return true;
});
exports.deleteUser = deleteUser;
