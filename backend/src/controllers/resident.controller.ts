import { Request, Response, NextFunction } from 'express';
import * as residentService from '../services/resident.service';
import { ApiError } from '../middleware/error.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all residents
export const getAllResidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', search, rtNumber, rwNumber } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const result = await residentService.getAllResidents({
      page: pageNum,
      limit: limitNum,
      search: search as string,
      rtNumber: rtNumber as string,
      rwNumber: rwNumber as string,
    }, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      results: result.residents.length,
      totalPages: result.totalPages,
      currentPage: pageNum,
      totalItems: result.totalItems,
      data: {
        residents: result.residents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get resident by ID
export const getResidentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const residentId = parseInt(req.params.id);
    
    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const resident = await residentService.getResidentById(residentId, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        resident,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create resident
export const createResident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const residentData = req.body;
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const newResident = await residentService.createResident(residentData, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Resident created successfully',
      data: {
        resident: newResident,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update resident
export const updateResident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const residentId = parseInt(req.params.id);
    
    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const residentData = req.body;
    
    const updatedResident = await residentService.updateResident(residentId, residentData, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Resident updated successfully',
      data: {
        resident: updatedResident,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete resident
export const deleteResident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const residentId = parseInt(req.params.id);
    
    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    await residentService.deleteResident(residentId, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Resident deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Verify resident
export const verifyResident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const residentId = parseInt(req.params.id);
    
    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const verifiedResident = await residentService.verifyResident(
      residentId, 
      {
        id: req.user.id,
        role: req.user.role
      }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Resident verified successfully',
      data: {
        resident: verifiedResident,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Import residents from CSV/Excel
export const importResidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { residents } = req.body;
    
    if (!Array.isArray(residents) || residents.length === 0) {
      throw new ApiError('Invalid residents data', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const result = await residentService.importResidents(residents, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      message: `Successfully imported ${result.success} residents with ${result.failed} failures`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get resident statistics
export const getResidentStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const statistics = await residentService.getResidentStatistics({
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        statistics,
      },
    });
  } catch (error) {
    next(error);
  }
}; 

// Get resident's social assistance history
export const getResidentSocialAssistance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const residentId = parseInt(req.params.id);
    
    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get all social assistance programs where this resident is a recipient
    const assistanceHistory = await prisma.socialAssistanceRecipient.findMany({
      where: {
        residentId: residentId
      },
      include: {
        socialAssistance: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        assistanceHistory
      }
    });
  } catch (error) {
    next(error);
  }
}; 