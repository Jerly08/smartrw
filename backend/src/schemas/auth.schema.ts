import { z } from 'zod';

// Register user schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'RW', 'RT', 'WARGA']).optional(),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

// Update profile schema
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().optional(),
}).refine(data => Object.values(data).some(val => val !== undefined), {
  message: 'At least one field must be provided',
});

// Verifikasi warga schema
export const verifyResidentSchema = z.object({
  name: z.string().min(2, 'Nama lengkap harus minimal 2 karakter'),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Tanggal lahir harus berupa tanggal yang valid',
  }),
  address: z.string().min(5, 'Alamat harus minimal 5 karakter'),
  rtId: z.number().positive('RT harus dipilih'),
  nik: z.string().length(16, 'NIK harus 16 digit'),
  noKK: z.string().length(16, 'Nomor KK harus 16 digit'),
  gender: z.enum(['LAKI_LAKI', 'PEREMPUAN'], { required_error: 'Jenis kelamin harus dipilih' }),
  familyRole: z.enum(['KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'LAINNYA'], { required_error: 'Status dalam keluarga harus dipilih' }),
});
