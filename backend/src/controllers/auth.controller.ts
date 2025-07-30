import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { ApiError } from '../middleware/error.middleware';
import path from 'path';
import fs from 'fs';

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

// Verifikasi warga dengan data lengkap dan pilihan RT
export const verifyResident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
const { name, birthDate, address, rtId, nik, noKK, gender, familyRole } = req.body;
    
    const result = await authService.verifyResidentWithRT(userId, {
      name,
      birthDate,
      address,
      rtId,
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
  } catch (error) {
    next(error);
  }
};

// Get available RTs for verification
export const getAvailableRTs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rts = await authService.getActiveRTs();
    
    res.status(200).json({
      status: 'success',
      data: {
        rts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Upload verification documents
export const uploadVerificationDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { name, birthDate, address, rtId, nik, noKK, gender, familyRole } = req.body;
    
    // Get the current user's resident data to get NIK and noKK
    const user = await authService.getUserProfile(userId);
    if (!user.resident || !user.resident.nik || !user.resident.noKK) {
      throw new ApiError('Please complete resident verification first before uploading documents', 400);
    }
    
    const residentNik = user.resident.nik;
    const residentNoKK = user.resident.noKK;
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads/residents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const uploadedFiles: string[] = [];
    
    // Validate file types (only PNG/JPG allowed)
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    
    // Process KTP file
    if (files.ktp && files.ktp[0]) {
      const ktpFile = files.ktp[0];
      
      if (!allowedMimeTypes.includes(ktpFile.mimetype)) {
        throw new ApiError('KTP file must be PNG or JPG format only', 400);
      }
      
      const ktpFileName = `ktp_${residentNik}.jpg`;
      const ktpPath = path.join(uploadDir, ktpFileName);
      
      // Write file to disk
      await fs.promises.writeFile(ktpPath, ktpFile.buffer);
      uploadedFiles.push(`/uploads/residents/${ktpFileName}`);
    }
    
    // Process KK file
    if (files.kk && files.kk[0]) {
      const kkFile = files.kk[0];
      
      if (!allowedMimeTypes.includes(kkFile.mimetype)) {
        throw new ApiError('KK file must be PNG or JPG format only', 400);
      }
      
      const kkFileName = `kk_${residentNoKK}.jpg`;
      const kkPath = path.join(uploadDir, kkFileName);
      
      // Write file to disk
      await fs.promises.writeFile(kkPath, kkFile.buffer);
      uploadedFiles.push(`/uploads/residents/${kkFileName}`);
    }
    
    if (uploadedFiles.length === 0) {
      throw new ApiError('No valid files uploaded', 400);
    }
    
    // Update resident verification data if provided
    let result;
    if (name && birthDate && address && rtId && nik && noKK && gender && familyRole) {
      result = await authService.verifyResidentWithRT(userId, {
        name,
        birthDate,
        address,
        rtId,
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
        resident: result?.resident || user.resident
      }
    });
    
  } catch (error) {
    next(error);
  }
};
