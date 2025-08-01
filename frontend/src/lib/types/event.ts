import { z } from 'zod';
import { User } from '../types';

// Event category enum (matching Prisma schema)
export enum EventCategory {
  KERJA_BAKTI = 'KERJA_BAKTI',
  RAPAT = 'RAPAT',
  ARISAN = 'ARISAN',
  KEAGAMAAN = 'KEAGAMAAN',
  OLAHRAGA = 'OLAHRAGA',
  PERAYAAN = 'PERAYAAN',
  LAINNYA = 'LAINNYA',
}

// RSVP status enum (matching Prisma schema)
export enum RSVPStatus {
  AKAN_HADIR = 'AKAN_HADIR',
  TIDAK_HADIR = 'TIDAK_HADIR',
  HADIR = 'HADIR',
}

// Event interface
export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  category: EventCategory;
  isPublished: boolean;
  targetRTs?: string; // JSON string of RT numbers
  createdBy: number;
  creator?: User;
  createdAt: string;
  updatedAt: string;
  participants?: EventParticipant[];
  photos?: EventPhoto[];
  participantCount?: {
    total: number;
    akanHadir: number;
    tidakHadir: number;
    hadir: number;
  };
}

// Event participant interface
export interface EventParticipant {
  id: number;
  eventId: number;
  userId: number;
  status: RSVPStatus;
  notes?: string;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// Event photo interface
export interface EventPhoto {
  id: number;
  eventId: number;
  photoUrl: string;
  caption?: string;
  createdAt: string;
}

// Event form schema
export const eventFormSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  location: z.string().min(3, 'Lokasi minimal 3 karakter'),
  startDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Tanggal mulai tidak valid',
  }),
  endDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Tanggal selesai tidak valid',
  }),
  category: z.nativeEnum(EventCategory, {
    errorMap: () => ({ message: 'Kategori harus dipilih' }),
  }),
  targetRTs: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
});

// Add validation to ensure end date is after start date
export const eventFormSchemaWithDateValidation = eventFormSchema.refine(
  data => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: 'Tanggal selesai harus setelah tanggal mulai',
    path: ['endDate'],
  }
);

export type EventFormData = z.infer<typeof eventFormSchema>;

// Event filter interface
export interface EventFilter {
  category?: EventCategory;
  startDate?: string;
  endDate?: string;
  rtNumber?: string;
  search?: string;
  isUpcoming?: boolean;
}

// RSVP form schema
export const rsvpFormSchema = z.object({
  status: z.nativeEnum(RSVPStatus, {
    errorMap: () => ({ message: 'Status kehadiran harus dipilih' }),
  }),
});

export type RSVPFormData = z.infer<typeof rsvpFormSchema>;

// Photo upload form schema
export const photoUploadSchema = z.object({
  photos: z.array(z.any()).min(1, 'Minimal 1 foto harus diunggah'),
  captions: z.array(z.string().optional()).optional(),
});

export type PhotoUploadData = z.infer<typeof photoUploadSchema>;

// Translated options for UI display
export const eventCategoryOptions = [
  { value: EventCategory.KERJA_BAKTI, label: 'Kerja Bakti' },
  { value: EventCategory.RAPAT, label: 'Rapat' },
  { value: EventCategory.ARISAN, label: 'Arisan' },
  { value: EventCategory.KEAGAMAAN, label: 'Keagamaan' },
  { value: EventCategory.OLAHRAGA, label: 'Olahraga' },
  { value: EventCategory.PERAYAAN, label: 'Perayaan' },
  { value: EventCategory.LAINNYA, label: 'Lainnya' },
];

export const rsvpStatusOptions = [
  { value: RSVPStatus.AKAN_HADIR, label: 'Akan Hadir', color: 'bg-green-100 text-green-800' },
  { value: RSVPStatus.TIDAK_HADIR, label: 'Tidak Hadir', color: 'bg-red-100 text-red-800' },
  { value: RSVPStatus.HADIR, label: 'Hadir', color: 'bg-blue-100 text-blue-800' },
]; 