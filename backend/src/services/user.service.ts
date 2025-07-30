import { PrismaClient, Role } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Get all users
export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      resident: {
        select: {
          id: true,
          fullName: true,
          rtNumber: true,
          rwNumber: true,
        },
      },
    },
  });

  return users;
};

// Get user by ID
export const getUserById = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      resident: true,
    },
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  return user;
};

// Update user
export const updateUser = async (userId: number, data: { name?: string; email?: string }) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError('User not found', 404);
  }

  // Check if email is already in use by another user
  if (data.email && data.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new ApiError('Email already in use', 400);
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// Update user role (admin only)
export const updateUserRole = async (userId: number, role: Role) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError('User not found', 404);
  }

  // Update user role
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// Link user to resident
export const linkUserToResident = async (userId: number, residentId: number) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { resident: true },
  });

  if (!existingUser) {
    throw new ApiError('User not found', 404);
  }

  // Check if user is already linked to a resident
  if (existingUser.resident) {
    throw new ApiError('User is already linked to a resident', 400);
  }

  // Check if resident exists
  const existingResident = await prisma.resident.findUnique({
    where: { id: residentId },
    include: { user: true },
  });

  if (!existingResident) {
    throw new ApiError('Resident not found', 404);
  }

  // Check if resident is already linked to a user
  if (existingResident.user) {
    throw new ApiError('Resident is already linked to a user', 400);
  }

  // Link user to resident
  await prisma.resident.update({
    where: { id: residentId },
    data: { userId },
  });

  // Get updated user with resident info
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { resident: true },
  });

  return updatedUser;
};

// Get RT list for RW user
export const getRTListForRW = async (user: any) => {
  // Get user's resident info to find their RW
  const userWithResident = await prisma.user.findUnique({
    where: { id: user.id },
    include: { resident: true },
  });

  if (!userWithResident || !userWithResident.resident) {
    throw new ApiError('User is not linked to a resident', 400);
  }

  const rwNumber = userWithResident.resident.rwNumber;

  // Get distinct RT numbers for the RW
  const distinctRTs = await prisma.resident.findMany({
    where: {
      rwNumber: rwNumber,
    },
    select: {
      rtNumber: true,
    },
    distinct: ['rtNumber'],
    orderBy: {
      rtNumber: 'asc',
    },
  });

  // Filter out null/undefined RT numbers and transform to the expected format
  const rtList = distinctRTs
    .filter(rt => rt.rtNumber != null)
    .map((rt, index) => ({
      id: index + 1,
      number: rt.rtNumber,
    }));

  return rtList;
};

// Delete user
export const deleteUser = async (userId: number) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError('User not found', 404);
  }

  // Delete user
  await prisma.user.delete({
    where: { id: userId },
  });

  return true;
};

// RW Management Functions

// Create RW user (admin only)
export const createRWUser = async (data: {
  name: string;
  email: string;
  rwNumber: string;
  phoneNumber?: string;
  address?: string;
}) => {
  // Check if email is already in use
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ApiError('Email already in use', 400);
  }

  // Check if RW number is already assigned
  const existingRWUser = await prisma.user.findFirst({
    where: {
      role: 'RW',
      resident: {
        rwNumber: data.rwNumber,
      },
    },
  });

  if (existingRWUser) {
    throw new ApiError(`RW ${data.rwNumber} already has an assigned user`, 400);
  }

  // Generate credentials
  const password = `RW${data.rwNumber}@2024`;
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user with RW role
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: 'RW',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Create resident profile for RW user
await prisma.resident.create({
    data: {
      fullName: data.name,
      nik: `RW${data.rwNumber}000000000000`, // Placeholder NIK for RW user
      noKK: `RW${data.rwNumber}0000000000000000`, // Placeholder KK for RW user
      gender: 'LAKI_LAKI', // Default value
      birthPlace: 'Unknown', // Placeholder value
      birthDate: new Date('2000-01-01'), // Placeholder date
      religion: 'ISLAM', // Default value
      maritalStatus: 'BELUM_KAWIN', // Default value
      address: data.address || `RW ${data.rwNumber}`,
      phoneNumber: data.phoneNumber,
      rtNumber: '000', // RW user is not assigned to specific RT
      rwNumber: data.rwNumber,
      familyRole: 'KEPALA_KELUARGA',
      isVerified: true,
      userId: user.id,
    },
  });

  return {
    user,
    credentials: {
      email: data.email,
      password,
    },
  };
};

// Get all RW users (admin only)
export const getAllRWUsers = async () => {
  const rwUsers = await prisma.user.findMany({
    where: {
      role: 'RW',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      resident: {
        select: {
          id: true,
          fullName: true,
          rwNumber: true,
          phoneNumber: true,
          address: true,
          isVerified: true,
        },
      },
    },
    orderBy: {
      resident: {
        rwNumber: 'asc',
      },
    },
  });

  return rwUsers;
};

// Update RW user (admin only)
export const updateRWUser = async (
  userId: number,
  data: {
    name?: string;
    email?: string;
    rwNumber?: string;
    phoneNumber?: string;
    address?: string;
    isActive?: boolean;
  }
) => {
  // Check if user exists and is RW role
  const existingUser = await prisma.user.findFirst({
    where: {
      id: userId,
      role: 'RW',
    },
    include: {
      resident: true,
    },
  });

  if (!existingUser) {
    throw new ApiError('RW user not found', 404);
  }

  // Check if email is already in use by another user
  if (data.email && data.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new ApiError('Email already in use', 400);
    }
  }

  // Check if RW number is already assigned to another user
  if (data.rwNumber && data.rwNumber !== existingUser.resident?.rwNumber) {
    const existingRWUser = await prisma.user.findFirst({
      where: {
        role: 'RW',
        resident: {
          rwNumber: data.rwNumber,
        },
        id: {
          not: userId,
        },
      },
    });

    if (existingRWUser) {
      throw new ApiError(`RW ${data.rwNumber} already has an assigned user`, 400);
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Update resident profile if exists
  if (existingUser.resident) {
    await prisma.resident.update({
      where: { id: existingUser.resident.id },
      data: {
        fullName: data.name || existingUser.resident.fullName,
        rwNumber: data.rwNumber || existingUser.resident.rwNumber,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : existingUser.resident.phoneNumber,
        address: data.address !== undefined ? data.address : existingUser.resident.address,
        isVerified: data.isActive !== undefined ? data.isActive : existingUser.resident.isVerified,
      },
    });
  }

  // Get updated user with resident info
  const userWithResident = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      resident: {
        select: {
          id: true,
          fullName: true,
          rwNumber: true,
          phoneNumber: true,
          address: true,
          isVerified: true,
        },
      },
    },
  });

  return userWithResident;
};

// Delete RW user (admin only)
export const deleteRWUser = async (userId: number) => {
  // Check if user exists and is RW role
  const existingUser = await prisma.user.findFirst({
    where: {
      id: userId,
      role: 'RW',
    },
    include: {
      resident: true,
    },
  });

  if (!existingUser) {
    throw new ApiError('RW user not found', 404);
  }

  // Delete resident profile first if exists
  if (existingUser.resident) {
    await prisma.resident.delete({
      where: { id: existingUser.resident.id },
    });
  }

  // Delete user
  await prisma.user.delete({
    where: { id: userId },
  });

  return true;
};
