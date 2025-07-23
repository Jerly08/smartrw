import { z } from 'zod';

// Base family schema for validation
const familyBaseSchema = {
  noKK: z.string().length(16, 'KK number must be exactly 16 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  rtNumber: z.string().min(1, 'RT number is required'),
  rwNumber: z.string().min(1, 'RW number is required'),
};

// Create family schema
export const createFamilySchema = z.object({
  body: z.object(familyBaseSchema),
});

// Update family schema
export const updateFamilySchema = z.object({
  body: z.object({
    noKK: z.string().length(16, 'KK number must be exactly 16 characters').optional(),
    address: z.string().min(5, 'Address must be at least 5 characters').optional(),
    rtNumber: z.string().min(1, 'RT number is required').optional(),
    rwNumber: z.string().min(1, 'RW number is required').optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

// Add family member schema
export const addFamilyMemberSchema = z.object({
  body: z.object({
    residentId: z.number().int().positive('Resident ID must be a positive integer'),
    familyRole: z.enum(['KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'LAINNYA'], {
      errorMap: () => ({ message: 'Invalid family role' }),
    }),
  }),
}); 