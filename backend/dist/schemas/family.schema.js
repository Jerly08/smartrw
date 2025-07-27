"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFamilyMemberSchema = exports.updateFamilySchema = exports.createFamilySchema = void 0;
const zod_1 = require("zod");
// Base family schema for validation
const familyBaseSchema = {
    noKK: zod_1.z.string().length(16, 'KK number must be exactly 16 characters'),
    address: zod_1.z.string().min(5, 'Address must be at least 5 characters'),
    rtNumber: zod_1.z.string().min(1, 'RT number is required'),
    rwNumber: zod_1.z.string().min(1, 'RW number is required'),
};
// Create family schema
exports.createFamilySchema = zod_1.z.object({
    body: zod_1.z.object(familyBaseSchema),
});
// Update family schema
exports.updateFamilySchema = zod_1.z.object({
    body: zod_1.z.object({
        noKK: zod_1.z.string().length(16, 'KK number must be exactly 16 characters').optional(),
        address: zod_1.z.string().min(5, 'Address must be at least 5 characters').optional(),
        rtNumber: zod_1.z.string().min(1, 'RT number is required').optional(),
        rwNumber: zod_1.z.string().min(1, 'RW number is required').optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    }),
});
// Add family member schema
exports.addFamilyMemberSchema = zod_1.z.object({
    body: zod_1.z.object({
        residentId: zod_1.z.number().int().positive('Resident ID must be a positive integer'),
        familyRole: zod_1.z.enum(['KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'LAINNYA'], {
            errorMap: () => ({ message: 'Invalid family role' }),
        }),
    }),
});
