import { z } from 'zod';
import { User } from '../types';

// Complaint category enum (matching Prisma schema)
export enum ComplaintCategory {
  LINGKUNGAN = 'LINGKUNGAN',
  KEAMANAN = 'KEAMANAN',
  SOSIAL = 'SOSIAL',
  INFRASTRUKTUR = 'INFRASTRUKTUR',
  ADMINISTRASI = 'ADMINISTRASI',
  LAINNYA = 'LAINNYA',
}

// Complaint status enum (matching Prisma schema)
export enum ComplaintStatus {
  DITERIMA = 'DITERIMA',
  DITINDAKLANJUTI = 'DITINDAKLANJUTI',
  SELESAI = 'SELESAI',
  DITOLAK = 'DITOLAK',
}

// Complaint interface
export interface Complaint {
  id: number;
  category: ComplaintCategory;
  title: string;
  description: string;
  location?: string;
  attachments?: string; // JSON string of file paths
  status: ComplaintStatus;
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdBy: number;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

// Complaint form schema
export const complaintFormSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  category: z.nativeEnum(ComplaintCategory, {
    errorMap: () => ({ message: 'Kategori harus dipilih' }),
  }),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  location: z.string().optional(),
  attachments: z.array(z.instanceof(File)).optional(),
});

export type ComplaintFormData = z.infer<typeof complaintFormSchema>;

// Response form schema
export const responseFormSchema = z.object({
  response: z.string().min(5, 'Tanggapan minimal 5 karakter'),
  status: z.nativeEnum(ComplaintStatus, {
    errorMap: () => ({ message: 'Status harus dipilih' }),
  }),
});

export type ResponseFormData = z.infer<typeof responseFormSchema>;

// Complaint filter interface
export interface ComplaintFilter {
  category?: ComplaintCategory;
  status?: ComplaintStatus;
  startDate?: string;
  endDate?: string;
  rtNumber?: string;
  search?: string;
}

// Translated options for UI display
export const complaintCategoryOptions = [
  { value: ComplaintCategory.LINGKUNGAN, label: 'Lingkungan', color: 'bg-green-100 text-green-800' },
  { value: ComplaintCategory.KEAMANAN, label: 'Keamanan', color: 'bg-red-100 text-red-800' },
  { value: ComplaintCategory.SOSIAL, label: 'Sosial', color: 'bg-blue-100 text-blue-800' },
  { value: ComplaintCategory.INFRASTRUKTUR, label: 'Infrastruktur', color: 'bg-yellow-100 text-yellow-800' },
  { value: ComplaintCategory.ADMINISTRASI, label: 'Administrasi', color: 'bg-purple-100 text-purple-800' },
  { value: ComplaintCategory.LAINNYA, label: 'Lainnya', color: 'bg-gray-100 text-gray-800' },
];

export const complaintStatusOptions = [
  { value: ComplaintStatus.DITERIMA, label: 'Diterima', color: 'bg-blue-100 text-blue-800' },
  { value: ComplaintStatus.DITINDAKLANJUTI, label: 'Ditindaklanjuti', color: 'bg-yellow-100 text-yellow-800' },
  { value: ComplaintStatus.SELESAI, label: 'Selesai', color: 'bg-green-100 text-green-800' },
  { value: ComplaintStatus.DITOLAK, label: 'Ditolak', color: 'bg-red-100 text-red-800' },
]; 