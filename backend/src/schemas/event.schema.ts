import { z } from 'zod';

// Event categories from Prisma schema
const eventCategories = [
  'KERJA_BAKTI',
  'RAPAT',
  'ARISAN',
  'KEAGAMAAN',
  'OLAHRAGA',
  'PERAYAAN',
  'LAINNYA'
] as const;

// RSVP statuses from Prisma schema
const rsvpStatuses = [
  'AKAN_HADIR',
  'TIDAK_HADIR',
  'HADIR'
] as const;

// Base event schema for validation
const eventBaseSchema = {
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Start date must be a valid date',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'End date must be a valid date',
  }),
  category: z.enum(eventCategories),
  isPublished: z.boolean().optional().default(false),
  targetRTs: z.array(z.string()).optional(), // Array of RT numbers
};

// Create event schema
export const createEventSchema = z.object(eventBaseSchema).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return startDate <= endDate;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

// Update event schema
export const updateEventSchema = z.object({
  ...Object.fromEntries(
    Object.entries(eventBaseSchema).map(([key, schema]) => [key, schema.optional()])
  ),
}).refine(data => Object.keys(data).length > 0, {
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
});

// RSVP schema
export const rsvpEventSchema = z.object({
  status: z.enum(rsvpStatuses),
});

// Upload event photo schema
export const uploadEventPhotoSchema = z.object({
  photoUrl: z.string().url('Photo URL must be a valid URL'),
  caption: z.string().optional(),
});

// Search events schema
export const searchEventsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    category: z.enum(eventCategories).optional().or(z.literal('')),
    search: z.string().optional().or(z.literal('')),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
    rtNumber: z.string().optional().or(z.literal('')),
    rwNumber: z.string().optional().or(z.literal('')),
    isUpcoming: z.string().optional().or(z.literal(''))
      .transform(val => val === 'true'),
  }).optional().default({}),
}); 