"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkUserToResidentSchema = exports.updateUserRoleSchema = exports.updateUserSchema = void 0;
const zod_1 = require("zod");
// Update user schema
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
        email: zod_1.z.string().email('Invalid email format').optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    }),
});
// Update user role schema (admin only)
exports.updateUserRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        role: zod_1.z.enum(['ADMIN', 'RW', 'RT', 'WARGA'], {
            errorMap: () => ({ message: 'Invalid role' }),
        }),
    }),
});
// User profile link to resident schema
exports.linkUserToResidentSchema = zod_1.z.object({
    body: zod_1.z.object({
        residentId: zod_1.z.number().int().positive('Resident ID must be a positive integer'),
    }),
});
