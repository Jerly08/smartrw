import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { ApiError } from '../middleware/error.middleware';

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.getAllUsers();
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    const user = await userService.getUserById(userId);
    
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Update user
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Check if user is updating their own profile or is an admin
    if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
      throw new ApiError('You do not have permission to update this user', 403);
    }
    
    const { name, email } = req.body;
    
    const updatedUser = await userService.updateUser(userId, { name, email });
    
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// Update user role (admin only)
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    const { role } = req.body;
    
    const updatedUser = await userService.updateUserRole(userId, role);
    
    res.status(200).json({
      status: 'success',
      message: 'User role updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// Link user to resident
export const linkUserToResident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    const { residentId } = req.body;
    
    if (isNaN(parseInt(residentId))) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    const updatedUser = await userService.linkUserToResident(userId, parseInt(residentId));
    
    res.status(200).json({
      status: 'success',
      message: 'User linked to resident successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    await userService.deleteUser(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}; 