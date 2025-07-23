import { Request, Response, NextFunction } from 'express';
import * as familyService from '../services/family.service';
import { ApiError } from '../middleware/error.middleware';

// Get all families
export const getAllFamilies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', search, rtNumber, rwNumber } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    const result = await familyService.getAllFamilies({
      page: pageNum,
      limit: limitNum,
      search: search as string,
      rtNumber: rtNumber as string,
      rwNumber: rwNumber as string,
    });
    
    res.status(200).json({
      status: 'success',
      results: result.families.length,
      totalPages: result.totalPages,
      currentPage: pageNum,
      totalItems: result.totalItems,
      data: {
        families: result.families,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get family by ID
export const getFamilyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = parseInt(req.params.id);
    
    if (isNaN(familyId)) {
      throw new ApiError('Invalid family ID', 400);
    }
    
    const family = await familyService.getFamilyById(familyId);
    
    res.status(200).json({
      status: 'success',
      data: {
        family,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get family by KK number
export const getFamilyByKK = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noKK } = req.params;
    
    if (!noKK) {
      throw new ApiError('KK number is required', 400);
    }
    
    const family = await familyService.getFamilyByKK(noKK);
    
    res.status(200).json({
      status: 'success',
      data: {
        family,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create family
export const createFamily = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyData = req.body;
    
    const newFamily = await familyService.createFamily(familyData);
    
    res.status(201).json({
      status: 'success',
      message: 'Family created successfully',
      data: {
        family: newFamily,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update family
export const updateFamily = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = parseInt(req.params.id);
    
    if (isNaN(familyId)) {
      throw new ApiError('Invalid family ID', 400);
    }
    
    const familyData = req.body;
    
    const updatedFamily = await familyService.updateFamily(familyId, familyData);
    
    res.status(200).json({
      status: 'success',
      message: 'Family updated successfully',
      data: {
        family: updatedFamily,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete family
export const deleteFamily = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = parseInt(req.params.id);
    
    if (isNaN(familyId)) {
      throw new ApiError('Invalid family ID', 400);
    }
    
    await familyService.deleteFamily(familyId);
    
    res.status(200).json({
      status: 'success',
      message: 'Family deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Add member to family
export const addFamilyMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = parseInt(req.params.id);
    const { residentId, familyRole } = req.body;
    
    if (isNaN(familyId) || isNaN(parseInt(residentId))) {
      throw new ApiError('Invalid ID parameters', 400);
    }
    
    if (!familyRole) {
      throw new ApiError('Family role is required', 400);
    }
    
    const updatedResident = await familyService.addFamilyMember(
      familyId,
      parseInt(residentId),
      familyRole
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Member added to family successfully',
      data: {
        resident: updatedResident,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove member from family
export const removeFamilyMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = parseInt(req.params.id);
    const residentId = parseInt(req.params.residentId);
    
    if (isNaN(familyId) || isNaN(residentId)) {
      throw new ApiError('Invalid ID parameters', 400);
    }
    
    const updatedResident = await familyService.removeFamilyMember(familyId, residentId);
    
    res.status(200).json({
      status: 'success',
      message: 'Member removed from family successfully',
      data: {
        resident: updatedResident,
      },
    });
  } catch (error) {
    next(error);
  }
}; 