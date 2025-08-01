"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVerificationDocuments = exports.getAvailableRTs = exports.verifyResident = exports.changePassword = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const authService = __importStar(require("../services/auth.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Register a new user
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name, role } = req.body;
        const result = yield authService.registerUser({ email, password, name, role });
        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.name,
                    role: result.user.role,
                },
                token: result.token,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.register = register;
// Login user
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const result = yield authService.loginUser(email, password);
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.name,
                    role: result.user.role,
                },
                token: result.token,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.login = login;
// Get current user profile
const getProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const userId = req.user.id;
        const user = yield authService.getUserProfile(userId);
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    resident: user.resident,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getProfile = getProfile;
// Update user profile
const updateProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const userId = req.user.id;
        const { name, email, phoneNumber } = req.body;
        const updatedUser = yield authService.updateUserProfile(userId, { name, email, phoneNumber });
        if (!updatedUser) {
            throw new error_middleware_1.ApiError('Failed to update user profile', 500);
        }
        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    role: updatedUser.role,
                    resident: updatedUser.resident,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateProfile = updateProfile;
// Change password
const changePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        yield authService.changeUserPassword(userId, currentPassword, newPassword);
        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.changePassword = changePassword;
// Verifikasi warga dengan data lengkap dan pilihan RT
const verifyResident = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const userId = req.user.id;
        const { name, birthDate, address, rtId, nik, noKK, gender, familyRole } = req.body;
        // Convert rtId to integer since Prisma expects number
        const rtIdNumber = parseInt(rtId, 10);
        if (isNaN(rtIdNumber)) {
            throw new error_middleware_1.ApiError('Invalid RT ID provided', 400);
        }
        const result = yield authService.verifyResidentWithRT(userId, {
            name,
            birthDate,
            address,
            rtId: rtIdNumber,
            nik,
            noKK,
            gender,
            familyRole
        });
        const message = result.isUpdate
            ? 'Data verifikasi berhasil diperbarui dan menunggu verifikasi ulang dari RT'
            : 'Verifikasi berhasil, data warga telah tersimpan di RT yang dipilih';
        res.status(200).json({
            status: 'success',
            message,
            data: {
                resident: result.resident,
                rt: result.rt,
                isUpdate: result.isUpdate
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.verifyResident = verifyResident;
// Get available RTs for verification
const getAvailableRTs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rts = yield authService.getActiveRTs();
        res.status(200).json({
            status: 'success',
            data: {
                rts
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAvailableRTs = getAvailableRTs;
// Upload verification documents
const uploadVerificationDocuments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Upload verification documents called');
        console.log('Request method:', req.method);
        console.log('Request URL:', req.originalUrl);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Body keys:', Object.keys(req.body));
        console.log('Files keys:', req.files ? Object.keys(req.files) : 'No files');
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const userId = req.user.id;
        const { name, birthDate, address, rtId, nik, noKK, gender, familyRole } = req.body;
        console.log('Request body data:', {
            name,
            birthDate,
            address,
            rtId,
            rtIdType: typeof rtId,
            nik,
            noKK,
            gender,
            familyRole
        });
        // Get the current user's resident data to get NIK and noKK
        const user = yield authService.getUserProfile(userId);
        if (!user.resident || !user.resident.nik || !user.resident.noKK) {
            throw new error_middleware_1.ApiError('Please complete resident verification first before uploading documents', 400);
        }
        const residentNik = user.resident.nik;
        const residentNoKK = user.resident.noKK;
        // Create upload directory if it doesn't exist
        const uploadDir = path_1.default.join(__dirname, '../../uploads/residents');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        const files = req.files;
        const uploadedFiles = [];
        console.log('Files received:', {
            hasKtp: !!(files.ktp && files.ktp[0]),
            hasKk: !!(files.kk && files.kk[0]),
            ktpBuffer: files.ktp && files.ktp[0] ? !!files.ktp[0].buffer : false,
            kkBuffer: files.kk && files.kk[0] ? !!files.kk[0].buffer : false
        });
        // Validate file types (PNG/JPG/PDF allowed)
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        // Process KTP file
        if (files.ktp && files.ktp[0]) {
            const ktpFile = files.ktp[0];
            console.log('Processing KTP file:', {
                filename: ktpFile.originalname,
                mimetype: ktpFile.mimetype,
                size: ktpFile.size,
                hasBuffer: !!ktpFile.buffer,
                bufferLength: ktpFile.buffer ? ktpFile.buffer.length : 0
            });
            if (!allowedMimeTypes.includes(ktpFile.mimetype)) {
                throw new error_middleware_1.ApiError('KTP file must be PNG, JPG, or PDF format only', 400);
            }
            if (!ktpFile.buffer) {
                throw new error_middleware_1.ApiError('KTP file buffer is missing', 400);
            }
            // Determine file extension based on mime type
            const fileExtension = ktpFile.mimetype === 'application/pdf' ? '.pdf' : '.jpg';
            const ktpFileName = `ktp_${residentNik}${fileExtension}`;
            const ktpPath = path_1.default.join(uploadDir, ktpFileName);
            // Remove existing files with different extensions
            const possibleExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
            for (const ext of possibleExtensions) {
                const existingPath = path_1.default.join(uploadDir, `ktp_${residentNik}${ext}`);
                if (fs_1.default.existsSync(existingPath)) {
                    yield fs_1.default.promises.unlink(existingPath);
                }
            }
            // Write new file to disk
            yield fs_1.default.promises.writeFile(ktpPath, ktpFile.buffer);
            uploadedFiles.push(`/uploads/residents/${ktpFileName}`);
        }
        // Process KK file
        if (files.kk && files.kk[0]) {
            const kkFile = files.kk[0];
            console.log('Processing KK file:', {
                filename: kkFile.originalname,
                mimetype: kkFile.mimetype,
                size: kkFile.size,
                hasBuffer: !!kkFile.buffer,
                bufferLength: kkFile.buffer ? kkFile.buffer.length : 0
            });
            if (!allowedMimeTypes.includes(kkFile.mimetype)) {
                throw new error_middleware_1.ApiError('KK file must be PNG, JPG, or PDF format only', 400);
            }
            if (!kkFile.buffer) {
                throw new error_middleware_1.ApiError('KK file buffer is missing', 400);
            }
            // Determine file extension based on mime type
            const fileExtension = kkFile.mimetype === 'application/pdf' ? '.pdf' : '.jpg';
            const kkFileName = `kk_${residentNoKK}${fileExtension}`;
            const kkPath = path_1.default.join(uploadDir, kkFileName);
            // Remove existing files with different extensions
            const possibleExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
            for (const ext of possibleExtensions) {
                const existingPath = path_1.default.join(uploadDir, `kk_${residentNoKK}${ext}`);
                if (fs_1.default.existsSync(existingPath)) {
                    yield fs_1.default.promises.unlink(existingPath);
                }
            }
            // Write new file to disk
            yield fs_1.default.promises.writeFile(kkPath, kkFile.buffer);
            uploadedFiles.push(`/uploads/residents/${kkFileName}`);
        }
        if (uploadedFiles.length === 0) {
            throw new error_middleware_1.ApiError('No valid files uploaded', 400);
        }
        // Update resident verification data if provided
        let result;
        if (name && birthDate && address && rtId && nik && noKK && gender && familyRole) {
            // Convert rtId to integer since Prisma expects number
            const rtIdNumber = parseInt(rtId, 10);
            if (isNaN(rtIdNumber)) {
                throw new error_middleware_1.ApiError('Invalid RT ID provided', 400);
            }
            result = yield authService.verifyResidentWithRT(userId, {
                name,
                birthDate,
                address,
                rtId: rtIdNumber,
                nik,
                noKK,
                gender,
                familyRole
            });
        }
        res.status(200).json({
            status: 'success',
            message: `Documents uploaded successfully: ${uploadedFiles.length} file(s)`,
            data: {
                uploadedFiles,
                resident: (result === null || result === void 0 ? void 0 : result.resident) || user.resident
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.uploadVerificationDocuments = uploadVerificationDocuments;
