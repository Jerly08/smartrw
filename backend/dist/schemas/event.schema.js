"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchEventsSchema = exports.uploadEventPhotoSchema = exports.rsvpEventSchema = exports.updateEventSchema = exports.createEventSchema = void 0;
const zod_1 = require("zod");
// Event categories from Prisma schema
const eventCategories = [
    'KERJA_BAKTI',
    'RAPAT',
    'ARISAN',
    'KEAGAMAAN',
    'OLAHRAGA',
    'PERAYAAN',
    'LAINNYA'
];
// RSVP statuses from Prisma schema
const rsvpStatuses = [
    'AKAN_HADIR',
    'TIDAK_HADIR',
    'HADIR'
];
// Base event schema for validation
const eventBaseSchema = {
    title: zod_1.z.string().min(5, 'Title must be at least 5 characters'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    location: zod_1.z.string().min(3, 'Location must be at least 3 characters'),
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Start date must be a valid date',
    }),
    endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'End date must be a valid date',
    }),
    category: zod_1.z.enum(eventCategories),
    isPublished: zod_1.z.boolean().optional().default(false),
    targetRTs: zod_1.z.string().optional(), // JSON array of RT numbers
};
// Create event schema
exports.createEventSchema = zod_1.z.object({
    body: zod_1.z.object(eventBaseSchema).refine((data) => {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return startDate <= endDate;
    }, {
        message: 'End date must be after or equal to start date',
        path: ['endDate'],
    }),
});
// Update event schema
exports.updateEventSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign({}, Object.fromEntries(Object.entries(eventBaseSchema).map(([key, schema]) => [key, schema.optional()])))).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    }).refine((data) => {
        if (data.startDate && data.endDate) {
            // Ensure both are strings before creating Date objects
            const startDate = new Date(String(data.startDate));
            const endDate = new Date(String(data.endDate));
            return startDate <= endDate;
        }
        return true;
    }, {
        message: 'End date must be after or equal to start date',
        path: ['endDate'],
    }),
});
// RSVP schema
exports.rsvpEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(rsvpStatuses),
    }),
});
// Upload event photo schema
exports.uploadEventPhotoSchema = zod_1.z.object({
    body: zod_1.z.object({
        photoUrl: zod_1.z.string().url('Photo URL must be a valid URL'),
        caption: zod_1.z.string().optional(),
    }),
});
// Search events schema
exports.searchEventsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().default('1'),
        limit: zod_1.z.string().optional().default('10'),
        category: zod_1.z.enum(eventCategories).optional().or(zod_1.z.literal('')),
        search: zod_1.z.string().optional().or(zod_1.z.literal('')),
        startDate: zod_1.z.string().optional().or(zod_1.z.literal('')),
        endDate: zod_1.z.string().optional().or(zod_1.z.literal('')),
        rtNumber: zod_1.z.string().optional().or(zod_1.z.literal('')),
        rwNumber: zod_1.z.string().optional().or(zod_1.z.literal('')),
        isUpcoming: zod_1.z.string().optional().or(zod_1.z.literal(''))
            .transform(val => val === 'true'),
    }).optional().default({}),
});
