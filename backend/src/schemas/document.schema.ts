import { z } from 'zod';

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
] as const;

// Document statuses from Prisma schema
const documentStatuses = [
  'DIAJUKAN',
  'DIPROSES',
  'DITOLAK',
  'DISETUJUI',
  'DITANDATANGANI',
  'SELESAI'
] as const;

// Base document schema for validation
const documentBaseSchema = {
  type: z.enum(documentTypes),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
};

// Create document schema
export const createDocumentSchema = z.object({
  body: z.object(documentBaseSchema),
});

// Update document schema
export const updateDocumentSchema = z.object({
  body: z.object({
    ...Object.fromEntries(
      Object.entries(documentBaseSchema).map(([key, schema]) => [key, schema.optional()])
    ),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

// Process document schema (approve, reject, sign)
export const processDocumentSchema = z.object({
  body: z.object({
    status: z.enum(documentStatuses),
    rejectionReason: z.string().optional(),
    notes: z.string().optional(),
  }),
});

// Search documents schema
export const searchDocumentsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    type: z.enum(documentTypes).optional().or(z.literal('')),
    status: z.enum(documentStatuses).optional().or(z.literal('')),
    search: z.string().optional().or(z.literal('')),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
    requesterId: z.string().optional().or(z.literal(''))
      .transform(val => {
        if (!val) return undefined;
        const parsed = parseInt(val);
        return isNaN(parsed) ? undefined : parsed;
      }),
    rtNumber: z.string().optional().or(z.literal('')),
  }).optional().default({}),
}); 