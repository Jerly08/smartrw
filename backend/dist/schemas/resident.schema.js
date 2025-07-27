"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importResidentsSchema = exports.verifyResidentSchema = exports.updateResidentSchema = exports.createResidentSchema = void 0;
const zod_1 = require("zod");
// Base resident schema for validation
const residentBaseSchema = {
    nik: zod_1.z.string().length(16, 'NIK must be exactly 16 characters'),
    noKK: zod_1.z.string().length(16, 'KK number must be exactly 16 characters'),
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    gender: zod_1.z.enum(['LAKI_LAKI', 'PEREMPUAN']),
    birthPlace: zod_1.z.string().min(2, 'Birth place must be at least 2 characters'),
    birthDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Birth date must be a valid date',
    }),
    address: zod_1.z.string().min(5, 'Address must be at least 5 characters'),
    rtNumber: zod_1.z.string().min(1, 'RT number is required'),
    rwNumber: zod_1.z.string().min(1, 'RW number is required'),
    religion: zod_1.z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA']),
    maritalStatus: zod_1.z.enum(['BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI']),
    occupation: zod_1.z.string().optional(),
    education: zod_1.z.enum(['TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3']).optional(),
    bpjsNumber: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Invalid email format').optional(),
    domicileStatus: zod_1.z.enum(['TETAP', 'KONTRAK', 'KOST', 'LAINNYA']).optional(),
    vaccinationStatus: zod_1.z.enum(['BELUM', 'DOSIS_1', 'DOSIS_2', 'BOOSTER_1', 'BOOSTER_2']).optional(),
    familyId: zod_1.z.number().optional(),
    familyRole: zod_1.z.enum(['KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'LAINNYA']).optional(),
    userId: zod_1.z.number().optional(),
};
// Create resident schema
exports.createResidentSchema = zod_1.z.object({
    body: zod_1.z.object(residentBaseSchema),
});
// Update resident schema
exports.updateResidentSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign({}, Object.fromEntries(Object.entries(residentBaseSchema).map(([key, schema]) => [key, schema.optional()])))).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    }),
});
// Verify resident schema
exports.verifyResidentSchema = zod_1.z.object({
    body: zod_1.z.object({
        // Optional additional verification data
        notes: zod_1.z.string().optional(),
    }),
});
// Import residents schema
exports.importResidentsSchema = zod_1.z.object({
    body: zod_1.z.object({
        residents: zod_1.z.array(zod_1.z.object(Object.assign({}, Object.fromEntries(Object.entries(residentBaseSchema).map(([key, schema]) => 
        // Make all fields optional for bulk import to allow partial data
        [key, key === 'nik' || key === 'fullName' ? schema : schema.optional()]))))).min(1, 'At least one resident must be provided'),
    }),
});
