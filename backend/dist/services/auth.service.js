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
exports.getActiveRTs = exports.verifyResidentWithRT = exports.changeUserPassword = exports.updateUserProfile = exports.getUserProfile = exports.loginUser = exports.createWelcomeNotifications = exports.registerUser = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("../middleware/error.middleware");
const prisma = new client_1.PrismaClient();
// Register a new user
const registerUser = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if email already exists
    const existingUser = yield prisma.user.findUnique({
        where: { email: userData.email },
    });
    if (existingUser) {
        throw new error_middleware_1.ApiError('Maaf, email tersebut telah terdaftar', 400);
    }
    // Hash password
    const salt = yield bcryptjs_1.default.genSalt(10);
    const hashedPassword = yield bcryptjs_1.default.hash(userData.password, salt);
    // Create new user
    const user = yield prisma.user.create({
        data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role || 'WARGA',
        },
    });
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    // Create token
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret);
    // Send welcome notifications to new users about active events and announcements
    yield (0, exports.createWelcomeNotifications)(user.id);
    return {
        user,
        token,
    };
});
exports.registerUser = registerUser;
// Create welcome notifications for new users about active events and announcements
const createWelcomeNotifications = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        // Get active published events (not expired)
        const activeEvents = yield prisma.event.findMany({
            where: {
                isPublished: true,
                OR: [
                    { endDate: { gte: now } }, // Events that haven't ended yet
                    { endDate: null }, // Events without end date (ongoing)
                ],
            },
            include: {
                creator: {
                    select: {
                        role: true,
                        name: true,
                    },
                },
            },
            orderBy: { startDate: 'asc' },
            take: 5, // Limit to 5 most recent events
        });
        // Get active announcements (recent forum posts)
        const activeAnnouncements = yield prisma.forumPost.findMany({
            where: {
                category: 'PENGUMUMAN',
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
            },
            include: {
                author: {
                    select: {
                        role: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 3, // Limit to 3 most recent announcements
        });
        const notificationService = yield Promise.resolve().then(() => __importStar(require('./notification.service')));
        // Create notifications for active events
        for (const event of activeEvents) {
            // Only notify about events from ADMIN, RW, or RT
            if (['ADMIN', 'RW', 'RT'].includes(event.creator.role)) {
                yield notificationService.createNotification({
                    userId,
                    type: 'EVENT',
                    title: `Kegiatan ${event.category}`,
                    message: `${event.title} akan dilaksanakan pada ${new Date(event.startDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}`,
                    priority: event.creator.role === 'ADMIN' || event.creator.role === 'RW' ? 'HIGH' : 'NORMAL',
                    eventId: event.id,
                    data: {
                        eventTitle: event.title,
                        eventDate: event.startDate,
                        eventLocation: event.location,
                        creatorRole: event.creator.role,
                        isWelcomeNotification: true,
                    },
                    expiresAt: event.endDate || new Date(event.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                });
            }
        }
        // Create notifications for active announcements
        for (const announcement of activeAnnouncements) {
            // Only notify about announcements from ADMIN, RW, or RT
            if (['ADMIN', 'RW', 'RT'].includes(announcement.author.role)) {
                let notificationTitle = 'Pengumuman';
                if (announcement.author.role === 'ADMIN') {
                    notificationTitle = 'Pengumuman Admin';
                }
                else if (announcement.author.role === 'RW') {
                    notificationTitle = 'Pengumuman Ketua RW';
                }
                else if (announcement.author.role === 'RT') {
                    notificationTitle = 'Pengumuman RT';
                }
                yield notificationService.createNotification({
                    userId,
                    type: 'ANNOUNCEMENT',
                    title: notificationTitle,
                    message: announcement.title,
                    priority: announcement.author.role === 'ADMIN' || announcement.author.role === 'RW' || announcement.isPinned ? 'HIGH' : 'NORMAL',
                    forumPostId: announcement.id,
                    data: {
                        postTitle: announcement.title,
                        postCategory: announcement.category,
                        authorName: announcement.author.name,
                        authorRole: announcement.author.role,
                        isPinned: announcement.isPinned,
                        isWelcomeNotification: true,
                    },
                    // Set expiration based on author role
                    expiresAt: new Date(Date.now() + (announcement.author.role === 'ADMIN' || announcement.author.role === 'RW' ? 30 : 7) * 24 * 60 * 60 * 1000),
                });
            }
        }
        // Create a welcome notification
        yield notificationService.createNotification({
            userId,
            type: 'SYSTEM',
            title: 'Selamat Datang di Smart RW!',
            message: 'Akun Anda telah berhasil dibuat. Jangan lupa untuk melengkapi profil dan verifikasi data Anda.',
            priority: 'NORMAL',
            data: {
                isWelcomeNotification: true,
                registrationDate: new Date(),
            },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
    }
    catch (error) {
        console.error('Error creating welcome notifications:', error);
        // Don't throw error to prevent it from breaking registration process
    }
});
exports.createWelcomeNotifications = createWelcomeNotifications;
// Login user
const loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    // Find user by email
    const user = yield prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new error_middleware_1.ApiError('Email atau password salah', 401);
    }
    // Check password
    const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new error_middleware_1.ApiError('Email atau password salah', 401);
    }
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    // Use a simpler approach for JWT signing
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret);
    return {
        user,
        token,
    };
});
exports.loginUser = loginUser;
// Get user profile with resident information
const getUserProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma.user.findUnique({
        where: { id: userId },
        include: {
            resident: true,
        },
    });
    if (!user) {
        throw new error_middleware_1.ApiError('User not found', 404);
    }
    return user;
});
exports.getUserProfile = getUserProfile;
// Update user profile
const updateUserProfile = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Find user first to check if it exists
    const user = yield prisma.user.findUnique({
        where: { id: userId },
        include: { resident: true },
    });
    if (!user) {
        throw new error_middleware_1.ApiError('User not found', 404);
    }
    // Check if email is already in use by another user
    if (data.email && data.email !== user.email) {
        const existingUser = yield prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser && existingUser.id !== userId) {
            throw new error_middleware_1.ApiError('Maaf, email tersebut telah terdaftar', 400);
        }
    }
    // Update user data
    const updatedUser = yield prisma.user.update({
        where: { id: userId },
        data: {
            name: data.name !== undefined ? data.name : undefined,
            email: data.email !== undefined ? data.email : undefined,
        },
        include: { resident: true },
    });
    // Update resident phone number if provided and resident exists
    if (data.phoneNumber && user.resident) {
        yield prisma.resident.update({
            where: { id: user.resident.id },
            data: { phoneNumber: data.phoneNumber },
        });
        // Refresh user data to include updated resident info
        const refreshedUser = yield prisma.user.findUnique({
            where: { id: userId },
            include: { resident: true },
        });
        if (!refreshedUser) {
            throw new error_middleware_1.ApiError('Failed to refresh user data', 500);
        }
        return refreshedUser;
    }
    return updatedUser;
});
exports.updateUserProfile = updateUserProfile;
// Change user password
const changeUserPassword = (userId, currentPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    // Find user
    const user = yield prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new error_middleware_1.ApiError('User not found', 404);
    }
    // Verify current password
    const isPasswordValid = yield bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        throw new error_middleware_1.ApiError('Current password is incorrect', 400);
    }
    // Hash new password
    const salt = yield bcryptjs_1.default.genSalt(10);
    const hashedPassword = yield bcryptjs_1.default.hash(newPassword, salt);
    // Update password
    yield prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });
    return true;
});
exports.changeUserPassword = changeUserPassword;
// Verify resident with RT selection
const verifyResidentWithRT = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists and doesn't already have a resident profile
    const user = yield prisma.user.findUnique({
        where: { id: userId },
        include: { resident: true },
    });
    if (!user) {
        throw new error_middleware_1.ApiError('User not found', 404);
    }
    // Check if user already has a resident profile - allow update
    let isUpdate = false;
    if (user.resident) {
        isUpdate = true;
        // Allow update but check if NIK is being changed to existing one
        if (data.nik !== user.resident.nik) {
            const existingNik = yield prisma.resident.findUnique({
                where: { nik: data.nik },
            });
            if (existingNik) {
                throw new error_middleware_1.ApiError('NIK sudah terdaftar oleh user lain', 400);
            }
        }
    }
    // Check if RT exists and is active
    const rt = yield prisma.rT.findUnique({
        where: { id: data.rtId, isActive: true },
    });
    if (!rt) {
        throw new error_middleware_1.ApiError('RT tidak ditemukan atau tidak aktif', 404);
    }
    // Validate NIK uniqueness only for new residents
    if (!isUpdate) {
        const existingNik = yield prisma.resident.findUnique({
            where: { nik: data.nik },
        });
        if (existingNik) {
            throw new error_middleware_1.ApiError('NIK sudah terdaftar', 400);
        }
    }
    // Create or update resident profile in transaction
    const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        let resident;
        if (isUpdate && user.resident) {
            // Update existing resident profile
            resident = yield tx.resident.update({
                where: { id: user.resident.id },
                data: {
                    nik: data.nik,
                    noKK: data.noKK,
                    fullName: data.name,
                    gender: data.gender,
                    birthDate: new Date(data.birthDate),
                    address: data.address,
                    rtNumber: rt.number,
                    rwNumber: '001', // Default RW, should be configurable
                    familyRole: data.familyRole,
                    rtId: data.rtId,
                    isVerified: false, // Reset verification status when updated
                    verifiedBy: null,
                    verifiedAt: null,
                },
                include: {
                    rt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            });
        }
        else {
            // Create new resident profile
            resident = yield tx.resident.create({
                data: {
                    nik: data.nik,
                    noKK: data.noKK,
                    fullName: data.name,
                    gender: data.gender,
                    birthPlace: 'Unknown', // Should be collected in form
                    birthDate: new Date(data.birthDate),
                    address: data.address,
                    rtNumber: rt.number,
                    rwNumber: '001', // Default RW, should be configurable
                    religion: 'ISLAM', // Default, should be collected in form
                    maritalStatus: 'BELUM_KAWIN', // Default, can be updated later
                    familyRole: data.familyRole,
                    userId: userId,
                    rtId: data.rtId,
                    isVerified: false, // Set to false, requires RT verification
                    verifiedBy: undefined,
                    verifiedAt: undefined,
                },
                include: {
                    rt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            });
        }
        return { resident, rt, isUpdate };
    }));
    // Create notifications for RT users when new resident registers or updates profile
    try {
        yield createResidentVerificationNotificationsForRT(result.resident);
    }
    catch (error) {
        console.error('Error creating resident verification notifications for RT:', error);
        // Don't fail the main process if notification fails
    }
    return result;
});
exports.verifyResidentWithRT = verifyResidentWithRT;
// Get active RTs for selection
const getActiveRTs = () => __awaiter(void 0, void 0, void 0, function* () {
    const rts = yield prisma.rT.findMany({
        where: { isActive: true },
        select: {
            id: true,
            number: true,
            name: true,
            description: true,
            address: true,
            chairperson: true,
            phoneNumber: true,
            _count: {
                select: {
                    residents: true,
                },
            },
        },
        orderBy: { number: 'asc' },
    });
    return rts;
});
exports.getActiveRTs = getActiveRTs;
// Helper function to create notifications for RT users when new residents register
function createResidentVerificationNotificationsForRT(resident) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { rtNumber, rwNumber } = resident;
            // Get all RT users for the resident's RT
            const rtUsers = yield prisma.user.findMany({
                where: {
                    role: 'RT',
                    resident: {
                        rtNumber,
                        rwNumber,
                    },
                },
            });
            // Create notifications for RT users
            for (const rtUser of rtUsers) {
                yield prisma.notification.create({
                    data: {
                        userId: rtUser.id,
                        type: 'SYSTEM',
                        title: 'Verifikasi Warga Baru',
                        message: `Warga baru ${resident.fullName} memerlukan verifikasi Anda`,
                        priority: 'HIGH',
                        data: JSON.stringify({
                            residentId: resident.id,
                            residentName: resident.fullName,
                            residentNik: resident.nik,
                            residentAddress: resident.address,
                        }),
                    },
                });
            }
        }
        catch (error) {
            console.error('Error creating resident verification notifications for RT:', error);
        }
    });
}
