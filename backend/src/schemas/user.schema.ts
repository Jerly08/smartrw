import { z } from 'zod';
import { Role } from '@prisma/client';

// Update user schema
export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

// Update user role schema (admin only)
export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'RW', 'RT', 'WARGA'], {
      errorMap: () => ({ message: 'Invalid role' }),
    }),
  }),
});

// User profile link to resident schema
export const linkUserToResidentSchema = z.object({
  body: z.object({
    residentId: z.number().int().positive('Resident ID must be a positive integer'),
  }),
}); 