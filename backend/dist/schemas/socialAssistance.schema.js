"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSocialAssistanceSchema = exports.updateRecipientSchema = exports.addRecipientSchema = exports.updateSocialAssistanceSchema = exports.createSocialAssistanceSchema = void 0;
const zod_1 = require("zod");
// Social assistance types from Prisma schema
const socialAssistanceTypes = [
    'BLT',
    'SEMBAKO',
    'KIS',
    'PKH',
    'LAINNYA'
];
// Social assistance statuses from Prisma schema
const socialAssistanceStatuses = [
    'DISIAPKAN',
    'DISALURKAN',
    'SELESAI'
];
// Base social assistance schema for validation
const socialAssistanceBaseSchema = {
    name: zod_1.z.string().min(3, 'Name must be at least 3 characters'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    startDate: zod_1.z.string().transform(val => new Date(val)),
    endDate: zod_1.z.string().transform(val => new Date(val)).optional(),
    source: zod_1.z.string().min(2, 'Source must be at least 2 characters'),
    type: zod_1.z.enum(socialAssistanceTypes),
};
// Create social assistance schema
exports.createSocialAssistanceSchema = zod_1.z.object({
    body: zod_1.z.object(socialAssistanceBaseSchema),
});
// Update social assistance schema
exports.updateSocialAssistanceSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign(Object.assign({}, Object.fromEntries(Object.entries(socialAssistanceBaseSchema).map(([key, schema]) => [key, schema.optional()]))), { status: zod_1.z.enum(socialAssistanceStatuses).optional() })).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    }),
});
// Add recipient schema
exports.addRecipientSchema = zod_1.z.object({
    body: zod_1.z.object({
        residentId: zod_1.z.number().int().positive('Resident ID must be a positive integer'),
        notes: zod_1.z.string().optional(),
    }),
});
// Update recipient schema
exports.updateRecipientSchema = zod_1.z.object({
    body: zod_1.z.object({
        notes: zod_1.z.string().optional(),
        isVerified: zod_1.z.boolean().optional(),
        receivedDate: zod_1.z.string().transform(val => new Date(val)).optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    }),
});
// Search social assistance schema
exports.searchSocialAssistanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().default('1'),
        limit: zod_1.z.string().optional().default('10'),
        search: zod_1.z.string().optional().or(zod_1.z.literal('')),
        type: zod_1.z.enum(socialAssistanceTypes).optional().or(zod_1.z.literal('')),
        status: zod_1.z.enum(socialAssistanceStatuses).optional().or(zod_1.z.literal('')),
        startDate: zod_1.z.string().optional().or(zod_1.z.literal('')),
        endDate: zod_1.z.string().optional().or(zod_1.z.literal('')),
        source: zod_1.z.string().optional().or(zod_1.z.literal('')),
    }).optional().default({}),
});
