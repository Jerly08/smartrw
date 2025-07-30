import { z } from 'zod';

// Document type enum (matching Prisma schema)
export enum DocumentType {
  DOMISILI = 'DOMISILI',
  PENGANTAR_SKCK = 'PENGANTAR_SKCK',
  TIDAK_MAMPU = 'TIDAK_MAMPU',
  USAHA = 'USAHA',
  KELAHIRAN = 'KELAHIRAN',
  KEMATIAN = 'KEMATIAN',
  PINDAH = 'PINDAH',
  LAINNYA = 'LAINNYA',
}

// Document status enum (matching Prisma schema)
export enum DocumentStatus {
  DIAJUKAN = 'DIAJUKAN',
  DIPROSES = 'DIPROSES',
  DITOLAK = 'DITOLAK',
  DISETUJUI = 'DISETUJUI',
  DITANDATANGANI = 'DITANDATANGANI',
  SELESAI = 'SELESAI',
}

// Document interface
export interface Document {
  id: number;
  type: DocumentType;
  requesterId: number;
  subject: string;
  description: string;
  attachments?: string; // JSON string of file paths
  status: DocumentStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  signedBy?: string;
  signedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: number;
    name: string;
    email: string;
    resident?: {
      id: number;
      fullName: string;
      nik: string;
      rtNumber: string;
      rwNumber: string;
    };
  };
}

// Document form schema
export const documentFormSchema = z.object({
  type: z.nativeEnum(DocumentType),
  subject: z.string().min(5, 'Subjek minimal 5 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  attachments: z.array(z.instanceof(File)).optional(),
});

export type DocumentFormData = z.infer<typeof documentFormSchema>;

// Document filter interface
export interface DocumentFilter {
  type?: DocumentType;
  status?: DocumentStatus;
  rtNumber?: string;
  requesterId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Document statistics interface
export interface DocumentStatistics {
  total: number;
  diajukan: number;
  diproses: number;
  disetujui: number;
  ditandatangani: number;
  selesai: number;
  ditolak: number;
  byType: {
    [key in DocumentType]: number;
  };
  byMonth: {
    month: string;
    count: number;
  }[];
}

// Document type options for UI
export const documentTypeOptions = [
  { value: DocumentType.DOMISILI, label: 'Surat Domisili' },
  { value: DocumentType.PENGANTAR_SKCK, label: 'Pengantar SKCK' },
  { value: DocumentType.TIDAK_MAMPU, label: 'Surat Tidak Mampu' },
  { value: DocumentType.USAHA, label: 'Surat Keterangan Usaha' },
  { value: DocumentType.KELAHIRAN, label: 'Surat Kelahiran' },
  { value: DocumentType.KEMATIAN, label: 'Surat Kematian' },
  { value: DocumentType.PINDAH, label: 'Surat Pindah' },
  { value: DocumentType.LAINNYA, label: 'Lainnya' },
];

// Document status options for UI
export const documentStatusOptions = [
  { value: DocumentStatus.DIAJUKAN, label: 'Diajukan', color: 'bg-yellow-100 text-yellow-800' },
  { value: DocumentStatus.DIPROSES, label: 'Diproses', color: 'bg-blue-100 text-blue-800' },
  { value: DocumentStatus.DISETUJUI, label: 'Disetujui', color: 'bg-green-100 text-green-800' },
  { value: DocumentStatus.DITANDATANGANI, label: 'Ditandatangani', color: 'bg-purple-100 text-purple-800' },
  { value: DocumentStatus.SELESAI, label: 'Selesai', color: 'bg-green-100 text-green-800' },
  { value: DocumentStatus.DITOLAK, label: 'Ditolak', color: 'bg-red-100 text-red-800' },
]; 