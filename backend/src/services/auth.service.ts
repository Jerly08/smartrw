import { PrismaClient, User, $Enums, Resident } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

// Interface for user registration data
interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
  role?: $Enums.Role;
}

// Interface for profile update data
interface UpdateProfileInput {
  name?: string;
  email?: string;
  phoneNumber?: string;
}

// Register a new user
export const registerUser = async (userData: RegisterUserInput): Promise<{ user: User; token: string }> => {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new ApiError('Maaf, email tersebut telah terdaftar', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  // Create new user
  const user = await prisma.user.create({
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
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret
  );

  return {
    user,
    token,
  };
};

// Login user
export const loginUser = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError('Email atau password salah', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError('Email atau password salah', 401);
  }

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  // Use a simpler approach for JWT signing
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret
  );

  return {
    user,
    token,
  };
};

// Get user profile with resident information
export const getUserProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      resident: true,
    },
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  return user;
};

// Update user profile
export const updateUserProfile = async (userId: number, data: UpdateProfileInput) => {
  // Find user first to check if it exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { resident: true },
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Check if email is already in use by another user
  if (data.email && data.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ApiError('Maaf, email tersebut telah terdaftar', 400);
    }
  }

  // Update user data
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      email: data.email !== undefined ? data.email : undefined,
    },
    include: { resident: true },
  });

  // Update resident phone number if provided and resident exists
  if (data.phoneNumber && user.resident) {
    await prisma.resident.update({
      where: { id: user.resident.id },
      data: { phoneNumber: data.phoneNumber },
    });

    // Refresh user data to include updated resident info
    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { resident: true },
    });
    
    if (!refreshedUser) {
      throw new ApiError('Failed to refresh user data', 500);
    }
    
    return refreshedUser;
  }

  return updatedUser;
};

// Change user password
export const changeUserPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError('Current password is incorrect', 400);
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return true;
};

// Interface for resident verification data
interface VerifyResidentInput {
  name: string;
  birthDate: string;
  address: string;
  rtId: number;
  nik: string;
  noKK: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  familyRole: 'KEPALA_KELUARGA' | 'ISTRI' | 'ANAK' | 'LAINNYA';
}

// Verify resident with RT selection
export const verifyResidentWithRT = async (userId: number, data: VerifyResidentInput) => {
  // Check if user exists and doesn't already have a resident profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { resident: true },
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Check if user already has a resident profile - allow update
  let isUpdate = false;
  if (user.resident) {
    isUpdate = true;
    // Allow update but check if NIK is being changed to existing one
    if (data.nik !== user.resident.nik) {
      const existingNik = await prisma.resident.findUnique({
        where: { nik: data.nik },
      });
      
      if (existingNik) {
        throw new ApiError('NIK sudah terdaftar oleh user lain', 400);
      }
    }
  }

  // Check if RT exists and is active
  const rt = await prisma.rT.findUnique({
    where: { id: data.rtId, isActive: true },
  });

  if (!rt) {
    throw new ApiError('RT tidak ditemukan atau tidak aktif', 404);
  }

  // Validate NIK uniqueness only for new residents
  if (!isUpdate) {
    const existingNik = await prisma.resident.findUnique({
      where: { nik: data.nik },
    });
    
    if (existingNik) {
      throw new ApiError('NIK sudah terdaftar', 400);
    }
  }

  // Create or update resident profile in transaction
  const result = await prisma.$transaction(async (tx) => {
    let resident;
    
    if (isUpdate && user.resident) {
      // Update existing resident profile
      resident = await tx.resident.update({
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
    } else {
      // Create new resident profile
      resident = await tx.resident.create({
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
  });

  // Create notifications for RT users when new resident registers or updates profile
  try {
    await createResidentVerificationNotificationsForRT(result.resident);
  } catch (error) {
    console.error('Error creating resident verification notifications for RT:', error);
    // Don't fail the main process if notification fails
  }

  return result;
};

// Get active RTs for selection
export const getActiveRTs = async () => {
  const rts = await prisma.rT.findMany({
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
};

// Helper function to create notifications for RT users when new residents register
async function createResidentVerificationNotificationsForRT(resident: Resident) {
  try {
    const { rtNumber, rwNumber } = resident;
    
    // Get all RT users for the resident's RT
    const rtUsers = await prisma.user.findMany({
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
      await prisma.notification.create({
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
  } catch (error) {
    console.error('Error creating resident verification notifications for RT:', error);
  }
}
