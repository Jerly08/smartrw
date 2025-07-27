"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchDocumentsSchema = exports.processDocumentSchema = exports.updateDocumentSchema = exports.createDocumentSchema = void 0;
const zod_1 = require("zod");
// Document types from Prisma schema
const documentTypes = [
    'DOMISILI',
    'PENGANTAR_SKCK',
    'TIDAK_MAMPU',
    'USAHA',
    'KELAHIRAN',
    'KEMATIAN',
    'PINDAH',
    'LAINNYA'
];
// Document statuses from Prisma schema
const documentStatuses = [
    'DIAJUKAN',
    'DIPROSES',
    'DITOLAK',
    'DISETUJUI',
    'DITANDATANGANI',
    'SELESAI'
];
// Base document schema for validation
const documentBaseSchema = {
    type: zod_1.z.enum(documentTypes),
    subject: zod_1.z.string().min(5, 'Subject must be at least 5 characters'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
};
// Create document schema
exports.createDocumentSchema = zod_1.z.object({
    body: zod_1.z.object(documentBaseSchema),
});
// Update document schema
exports.updateDocumentSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign({}, Object.fromEntries(Object.entries(documentBaseSchema).map(([key, schema]) => [key, schema.optional()])))).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    }),
});
// Process document schema (approve, reject, sign)
exports.processDocumentSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(documentStatuses),
        rejectionReason: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    }),
});
// Search documents schema
exports.searchDocumentsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().default('1'),
        limit: zod_1.z.string().optional().default('10'),
        type: zod_1.z.enum(documentTypes).optional().or(zod_1.z.literal('')),
        status: zod_1.z.enum(documentStatuses).optional().or(zod_1.z.literal('')),
        search: zod_1.z.string().optional().or(zod_1.z.literal('')),
        startDate: zod_1.z.string().optional().or(zod_1.z.literal('')),
        endDate: zod_1.z.string().optional().or(zod_1.z.literal('')),
        requesterId: zod_1.z.string().optional().or(zod_1.z.literal(''))
            .transform(val => {
            if (!val)
                return undefined;
            const parsed = parseInt(val);
            return isNaN(parsed) ? undefined : parsed;
        }),
        rtNumber: zod_1.z.string().optional().or(zod_1.z.literal('')),
    }).optional().default({}),
});
