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
exports.deleteUser = exports.getRTListForRW = exports.linkUserToResident = exports.updateUserRole = exports.updateUser = exports.getUserById = exports.getAllUsers = void 0;
const userService = __importStar(require("../services/user.service"));
const error_middleware_1 = require("../middleware/error.middleware");
// Get all users (admin only)
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield userService.getAllUsers();
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllUsers = getAllUsers;
// Get user by ID
const getUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            throw new error_middleware_1.ApiError('Invalid user ID', 400);
        }
        const user = yield userService.getUserById(userId);
        res.status(200).json({
            status: 'success',
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserById = getUserById;
// Update user
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            throw new error_middleware_1.ApiError('Invalid user ID', 400);
        }
        // Check if user is updating their own profile or is an admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN') {
            throw new error_middleware_1.ApiError('You do not have permission to update this user', 403);
        }
        const { name, email } = req.body;
        const updatedUser = yield userService.updateUser(userId, { name, email });
        res.status(200).json({
            status: 'success',
            message: 'User updated successfully',
            data: { user: updatedUser },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateUser = updateUser;
// Update user role (admin only)
const updateUserRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            throw new error_middleware_1.ApiError('Invalid user ID', 400);
        }
        const { role } = req.body;
        const updatedUser = yield userService.updateUserRole(userId, role);
        res.status(200).json({
            status: 'success',
            message: 'User role updated successfully',
            data: { user: updatedUser },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateUserRole = updateUserRole;
// Link user to resident
const linkUserToResident = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            throw new error_middleware_1.ApiError('Invalid user ID', 400);
        }
        const { residentId } = req.body;
        if (isNaN(parseInt(residentId))) {
            throw new error_middleware_1.ApiError('Invalid resident ID', 400);
        }
        const updatedUser = yield userService.linkUserToResident(userId, parseInt(residentId));
        res.status(200).json({
            status: 'success',
            message: 'User linked to resident successfully',
            data: { user: updatedUser },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.linkUserToResident = linkUserToResident;
// Get RT list for RW user
const getRTListForRW = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Only RW and Admin can access this endpoint
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'RW' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN') {
            throw new error_middleware_1.ApiError('You do not have permission to access this resource', 403);
        }
        const rtList = yield userService.getRTListForRW(req.user);
        res.status(200).json({
            status: 'success',
            results: rtList.length,
            data: { rtList },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRTListForRW = getRTListForRW;
// Delete user (admin only)
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            throw new error_middleware_1.ApiError('Invalid user ID', 400);
        }
        yield userService.deleteUser(userId);
        res.status(200).json({
            status: 'success',
            message: 'User deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteUser = deleteUser;
