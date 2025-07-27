"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchComplaintsSchema = exports.respondComplaintSchema = exports.updateComplaintSchema = exports.createComplaintSchema = void 0;
const zod_1 = require("zod");
// Complaint categories from Prisma schema
const complaintCategories = [
    'LINGKUNGAN',
    'KEAMANAN',
    'SOSIAL',
    'INFRASTRUKTUR',
    'ADMINISTRASI',
    'LAINNYA'
];
// Complaint statuses from Prisma schema
const complaintStatuses = [
    'DITERIMA',
    'DITINDAKLANJUTI',
    'SELESAI',
    'DITOLAK'
];
// Base complaint schema for validation
const complaintBaseSchema = {
    category: zod_1.z.enum(complaintCategories),
    title: zod_1.z.string().min(5, 'Title must be at least 5 characters'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    location: zod_1.z.string().optional(),
    attachments: zod_1.z.any().optional(), // Allow any type for attachments to handle file uploads
};
// Create complaint schema
exports.createComplaintSchema = zod_1.z.object({
    body: zod_1.z.object({
        category: zod_1.z.enum(complaintCategories),
        title: zod_1.z.string().min(5, 'Title must be at least 5 characters'),
        description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
        location: zod_1.z.string().optional(),
    }),
});
// Update complaint schema
exports.updateComplaintSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign({}, Object.fromEntries(Object.entries(complaintBaseSchema).map(([key, schema]) => [key, schema.optional()])))).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    }),
});
// Response complaint schema
exports.respondComplaintSchema = zod_1.z.object({
    body: zod_1.z.object({
        response: zod_1.z.string().min(5, 'Response must be at least 5 characters'),
        status: zod_1.z.enum(['DITINDAKLANJUTI', 'SELESAI', 'DITOLAK']),
    }),
});
// Search complaints schema
exports.searchComplaintsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().default('1'),
        limit: zod_1.z.string().optional().default('10'),
        category: zod_1.z.enum(complaintCategories).optional().or(zod_1.z.literal('')),
        status: zod_1.z.enum(complaintStatuses).optional().or(zod_1.z.literal('')),
        search: zod_1.z.string().optional().or(zod_1.z.literal('')),
        startDate: zod_1.z.string().optional().or(zod_1.z.literal('')),
        endDate: zod_1.z.string().optional().or(zod_1.z.literal('')),
        rtNumber: zod_1.z.string().optional().or(zod_1.z.literal('')),
        rwNumber: zod_1.z.string().optional().or(zod_1.z.literal('')),
    }).optional().default({}),
});
