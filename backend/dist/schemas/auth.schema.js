"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.changePasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Register user schema
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        role: zod_1.z.enum(['ADMIN', 'RW', 'RT', 'WARGA']).optional(),
    }),
});
// Login schema
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
// Change password schema
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: zod_1.z
            .string()
            .min(6, 'Password must be at least 6 characters'),
    }),
});
// Update profile schema
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
        email: zod_1.z.string().email('Invalid email format').optional(),
        phoneNumber: zod_1.z.string().optional(),
    }).refine(data => Object.values(data).some(val => val !== undefined), {
        message: 'At least one field must be provided',
    }),
});
