import { z } from 'zod';

// Base resident schema for validation
const residentBaseSchema = {
  nik: z.string().length(16, 'NIK must be exactly 16 characters'),
  noKK: z.string().length(16, 'KK number must be exactly 16 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  gender: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
  birthPlace: z.string().min(2, 'Birth place must be at least 2 characters'),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Birth date must be a valid date',
  }),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  rtNumber: z.string().min(1, 'RT number is required'),
  rwNumber: z.string().min(1, 'RW number is required'),
  religion: z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA']),
  maritalStatus: z.enum(['BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI']),
  occupation: z.string().optional(),
  education: z.enum(['TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3']).optional(),
  bpjsNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  domicileStatus: z.enum(['TETAP', 'KONTRAK', 'KOST', 'LAINNYA']).optional(),
  vaccinationStatus: z.enum(['BELUM', 'DOSIS_1', 'DOSIS_2', 'BOOSTER_1', 'BOOSTER_2']).optional(),
  familyId: z.number().optional(),
  familyRole: z.enum(['KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'LAINNYA']).optional(),
  userId: z.number().optional(),
};

// Create resident schema
export const createResidentSchema = z.object({
  body: z.object(residentBaseSchema),
});

// Update resident schema
export const updateResidentSchema = z.object({
  body: z.object({
    ...Object.fromEntries(
      Object.entries(residentBaseSchema).map(([key, schema]) => [key, schema.optional()])
    ),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

// Verify resident schema
export const verifyResidentSchema = z.object({
  body: z.object({
    // Optional additional verification data
    notes: z.string().optional(),
  }),
});

// Import residents schema
export const importResidentsSchema = z.object({
  body: z.object({
    residents: z.array(
      z.object({
        ...Object.fromEntries(
          Object.entries(residentBaseSchema).map(([key, schema]) => 
            // Make all fields optional for bulk import to allow partial data
            [key, key === 'nik' || key === 'fullName' ? schema : schema.optional()]
          )
        ),
      })
    ).min(1, 'At least one resident must be provided'),
  }),
}); 