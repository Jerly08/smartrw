import { z } from 'zod';
import { User } from '../types';
import { Resident } from './resident';

// Social assistance type enum (matching Prisma schema)
export enum SocialAssistanceType {
  BLT = 'BLT',
  SEMBAKO = 'SEMBAKO',
  KIS = 'KIS',
  PKH = 'PKH',
  LAINNYA = 'LAINNYA',
}

// Social assistance status enum (matching Prisma schema)
export enum SocialAssistanceStatus {
  DISIAPKAN = 'DISIAPKAN',
  DISALURKAN = 'DISALURKAN',
  SELESAI = 'SELESAI',
}

// Social assistance interface
export interface SocialAssistance {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  source: string;
  type: SocialAssistanceType;
  status: SocialAssistanceStatus;
  createdAt: string;
  updatedAt: string;
  recipients?: SocialAssistanceRecipient[];
  recipientCount?: number;
}

// Social assistance recipient interface
export interface SocialAssistanceRecipient {
  id: number;
  socialAssistanceId: number;
  socialAssistance?: SocialAssistance;
  residentId: number;
  resident?: Resident;
  receivedDate?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Social assistance form schema
export const socialAssistanceFormSchema = z.object({
  name: z.string().min(5, 'Nama bantuan minimal 5 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  startDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Tanggal mulai tidak valid',
  }),
  endDate: z.string().optional().refine(date => !date || !isNaN(Date.parse(date)), {
    message: 'Tanggal selesai tidak valid',
  }),
  source: z.string().min(3, 'Sumber bantuan minimal 3 karakter'),
  type: z.nativeEnum(SocialAssistanceType, {
    errorMap: () => ({ message: 'Tipe bantuan harus dipilih' }),
  }),
});

export type SocialAssistanceFormData = z.infer<typeof socialAssistanceFormSchema>;

// Add validation to ensure end date is after start date if provided
export const socialAssistanceFormSchemaWithDateValidation = socialAssistanceFormSchema.refine(
  data => !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
  {
    message: 'Tanggal selesai harus setelah tanggal mulai',
    path: ['endDate'],
  }
);

// Social assistance recipient form schema
export const recipientFormSchema = z.object({
  residentId: z.number({
    required_error: 'Warga harus dipilih',
    invalid_type_error: 'Warga harus dipilih',
  }),
  notes: z.string().optional(),
});

export type RecipientFormData = z.infer<typeof recipientFormSchema>;

// Verification form schema
export const verificationFormSchema = z.object({
  isVerified: z.boolean(),
  notes: z.string().optional(),
});

export type VerificationFormData = z.infer<typeof verificationFormSchema>;

// Distribution form schema
export const distributionFormSchema = z.object({
  receivedDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Tanggal penerimaan tidak valid',
  }),
  notes: z.string().optional(),
});

export type DistributionFormData = z.infer<typeof distributionFormSchema>;

// Social assistance filter interface
export interface SocialAssistanceFilter {
  type?: SocialAssistanceType;
  status?: SocialAssistanceStatus;
  startDate?: string;
  endDate?: string;
  source?: string;
  search?: string;
}

// Recipient filter interface
export interface RecipientFilter {
  isVerified?: boolean;
  hasReceived?: boolean;
  rtNumber?: string;
  search?: string;
}

// Translated options for UI display
export const socialAssistanceTypeOptions = [
  { value: SocialAssistanceType.BLT, label: 'Bantuan Langsung Tunai (BLT)', color: 'bg-green-100 text-green-800' },
  { value: SocialAssistanceType.SEMBAKO, label: 'Sembako', color: 'bg-blue-100 text-blue-800' },
  { value: SocialAssistanceType.KIS, label: 'Kartu Indonesia Sehat (KIS)', color: 'bg-purple-100 text-purple-800' },
  { value: SocialAssistanceType.PKH, label: 'Program Keluarga Harapan (PKH)', color: 'bg-yellow-100 text-yellow-800' },
  { value: SocialAssistanceType.LAINNYA, label: 'Lainnya', color: 'bg-gray-100 text-gray-800' },
];

export const socialAssistanceStatusOptions = [
  { value: SocialAssistanceStatus.DISIAPKAN, label: 'Disiapkan', color: 'bg-blue-100 text-blue-800' },
  { value: SocialAssistanceStatus.DISALURKAN, label: 'Disalurkan', color: 'bg-yellow-100 text-yellow-800' },
  { value: SocialAssistanceStatus.SELESAI, label: 'Selesai', color: 'bg-green-100 text-green-800' },
]; 