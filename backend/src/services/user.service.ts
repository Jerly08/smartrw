import { PrismaClient, Role } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';

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