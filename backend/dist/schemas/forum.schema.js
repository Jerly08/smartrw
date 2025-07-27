"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchForumCommentsSchema = exports.searchForumPostsSchema = exports.updateForumCommentSchema = exports.createForumCommentSchema = exports.updateForumPostSchema = exports.createForumPostSchema = void 0;
const zod_1 = require("zod");
// Forum categories from Prisma schema
const forumCategories = [
    'PENGUMUMAN',
    'DISKUSI',
    'POLLING',
    'LAINNYA'
];
// Base forum post schema for validation
const forumPostBaseSchema = {
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    content: zod_1.z.string().min(10, 'Content must be at least 10 characters'),
    category: zod_1.z.enum(forumCategories),
    isPinned: zod_1.z.boolean().optional(),
    isLocked: zod_1.z.boolean().optional(),
};
// Create forum post schema
exports.createForumPostSchema = zod_1.z.object({
    body: zod_1.z.object(forumPostBaseSchema),
});
// Update forum post schema
exports.updateForumPostSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign({}, Object.fromEntries(Object.entries(forumPostBaseSchema).map(([key, schema]) => [key, schema.optional()])))).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    }),
});
// Create forum comment schema
exports.createForumCommentSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1, 'Comment content cannot be empty'),
    }),
});
// Update forum comment schema
exports.updateForumCommentSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1, 'Comment content cannot be empty'),
    }),
});
// Search forum posts schema
exports.searchForumPostsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        category: zod_1.z.enum(forumCategories).optional(),
        isPinned: zod_1.z.string().optional(),
        isLocked: zod_1.z.string().optional(),
        authorId: zod_1.z.string().optional(),
        rtNumber: zod_1.z.string().optional(),
        rwNumber: zod_1.z.string().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }).optional(),
});
// Search forum comments schema
exports.searchForumCommentsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }).optional(),
});
