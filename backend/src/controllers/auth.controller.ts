import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { ApiError } from '../middleware/error.middleware';

// Register a new user
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role } = req.body;
    
    const result = await authService.registerUser({ email, password, name, role });
    
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
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.loginUser(email, password);
    
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
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const user = await authService.getUserProfile(userId);
    
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
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { name, email, phoneNumber } = req.body;
    
    const updatedUser = await authService.updateUserProfile(userId, { name, email, phoneNumber });
    
    if (!updatedUser) {
      throw new ApiError('Failed to update user profile', 500);
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
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    await authService.changeUserPassword(userId, currentPassword, newPassword);
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}; 