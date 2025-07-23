import { PrismaClient, User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

// Interface for user registration data
interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
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
    throw new ApiError('Email already in use', 400);
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
    throw new ApiError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError('Invalid email or password', 401);
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
      throw new ApiError('Email already in use', 400);
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