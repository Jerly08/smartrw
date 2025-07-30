"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyResidentSchema = exports.updateProfileSchema = exports.changePasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Register user schema
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    role: zod_1.z.enum(['ADMIN', 'RW', 'RT', 'WARGA']).optional(),
});
// Login schema
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// Change password schema
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z
        .string()
        .min(6, 'Password must be at least 6 characters'),
});
// Update profile schema
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: zod_1.z.string().email('Invalid email format').optional(),
    phoneNumber: zod_1.z.string().optional(),
}).refine(data => Object.values(data).some(val => val !== undefined), {
    message: 'At least one field must be provided',
});
// Verifikasi warga schema
exports.verifyResidentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nama lengkap harus minimal 2 karakter'),
    birthDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Tanggal lahir harus berupa tanggal yang valid',
    }),
    address: zod_1.z.string().min(5, 'Alamat harus minimal 5 karakter'),
    rtId: zod_1.z.number().positive('RT harus dipilih'),
    nik: zod_1.z.string().length(16, 'NIK harus 16 digit'),
    noKK: zod_1.z.string().length(16, 'Nomor KK harus 16 digit'),
    gender: zod_1.z.enum(['LAKI_LAKI', 'PEREMPUAN'], { required_error: 'Jenis kelamin harus dipilih' }),
    familyRole: zod_1.z.enum(['KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'LAINNYA'], { required_error: 'Status dalam keluarga harus dipilih' }),
});
