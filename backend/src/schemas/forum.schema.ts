import { z } from 'zod';

// Forum categories from Prisma schema
const forumCategories = [
  'PENGUMUMAN',
  'DISKUSI',
  'POLLING',
  'LAINNYA'
] as const;

// Base forum post schema for validation
const forumPostBaseSchema = {
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.enum(forumCategories),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
};

// Create forum post schema
export const createForumPostSchema = z.object({
  body: z.object(forumPostBaseSchema),
});

// Update forum post schema
export const updateForumPostSchema = z.object({
  body: z.object({
    ...Object.fromEntries(
      Object.entries(forumPostBaseSchema).map(([key, schema]) => [key, schema.optional()])
    ),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

// Create forum comment schema
export const createForumCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty'),
  }),
});

// Update forum comment schema
export const updateForumCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty'),
  }),
});

// Search forum posts schema
export const searchForumPostsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.enum(forumCategories).optional(),
    isPinned: z.string().optional(),
    isLocked: z.string().optional(),
    authorId: z.string().optional(),
    rtNumber: z.string().optional(),
    rwNumber: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
});

// Search forum comments schema
export const searchForumCommentsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
}); 