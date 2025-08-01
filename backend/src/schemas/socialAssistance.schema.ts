import { z } from 'zod';

// Social assistance types from Prisma schema
const socialAssistanceTypes = [
  'BLT',
  'SEMBAKO',
  'KIS',
  'PKH',
  'LAINNYA'
] as const;

// Social assistance statuses from Prisma schema
const socialAssistanceStatuses = [
  'DISIAPKAN',
  'DISALURKAN',
  'SELESAI'
] as const;

// Base social assistance schema for validation
const socialAssistanceBaseSchema = {
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)).optional(),
  source: z.string().min(2, 'Source must be at least 2 characters'),
  type: z.enum(socialAssistanceTypes),
};

// Create social assistance schema
export const createSocialAssistanceSchema = z.object(socialAssistanceBaseSchema);

// Update social assistance schema
export const updateSocialAssistanceSchema = z.object({
  ...Object.fromEntries(
    Object.entries(socialAssistanceBaseSchema).map(([key, schema]) => [key, schema.optional()])
  ),
  status: z.enum(socialAssistanceStatuses).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Add recipient schema
export const addRecipientSchema = z.object({
  residentId: z.number().int().positive('Resident ID must be a positive integer'),
  notes: z.string().optional(),
});

// Update recipient schema
export const updateRecipientSchema = z.object({
  notes: z.string().optional(),
  isVerified: z.boolean().optional(),
  receivedDate: z.string().transform(val => new Date(val)).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Search social assistance schema
export const searchSocialAssistanceSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional().or(z.literal('')),
    type: z.enum(socialAssistanceTypes).optional().or(z.literal('')),
    status: z.enum(socialAssistanceStatuses).optional().or(z.literal('')),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
    source: z.string().optional().or(z.literal('')),
  }).optional().default({}),
}); 