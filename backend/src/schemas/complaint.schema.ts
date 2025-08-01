import { z } from 'zod';

// Complaint categories from Prisma schema
const complaintCategories = [
  'LINGKUNGAN',
  'KEAMANAN',
  'SOSIAL',
  'INFRASTRUKTUR',
  'ADMINISTRASI',
  'LAINNYA'
] as const;

// Complaint statuses from Prisma schema
const complaintStatuses = [
  'DITERIMA',
  'DITINDAKLANJUTI',
  'SELESAI',
  'DITOLAK'
] as const;

// Base complaint schema for validation
const complaintBaseSchema = {
  category: z.enum(complaintCategories),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().optional(),
  attachments: z.any().optional(), // Allow any type for attachments to handle file uploads
};

// Create complaint schema
export const createComplaintSchema = z.object({
  body: z.object({
    category: z.enum(complaintCategories),
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    location: z.string().optional(),
  }),
});

// Update complaint schema
export const updateComplaintSchema = z.object({
  body: z.object({
    ...Object.fromEntries(
      Object.entries(complaintBaseSchema).map(([key, schema]) => [key, schema.optional()])
    ),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

// Response complaint schema
export const respondComplaintSchema = z.object({
  response: z.string().min(5, 'Response must be at least 5 characters'),
  status: z.enum(['DITINDAKLANJUTI', 'SELESAI', 'DITOLAK']),
});

// Search complaints schema
export const searchComplaintsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    category: z.enum(complaintCategories).optional().or(z.literal('')),
    status: z.enum(complaintStatuses).optional().or(z.literal('')),
    search: z.string().optional().or(z.literal('')),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
    rtNumber: z.string().optional().or(z.literal('')),
    rwNumber: z.string().optional().or(z.literal('')),
  }).optional().default({}),
}); 