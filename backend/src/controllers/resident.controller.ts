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

// Export residents data
export const exportResidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Extract query parameters
    const {
      format = 'json',
      search,
      rtNumber,
      rwNumber,
      page,
      limit
    } = req.query;
    
    // Prepare parameters for the service
    const params = {
      search: search as string,
      rtNumber: rtNumber as string,
      rwNumber: rwNumber as string
    };
    
    const currentUser = {
      id: req.user.id,
      role: req.user.role
    };
    
    const residents = await residentService.exportResidents(params, currentUser);
    
    if (format === 'csv') {
      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="residents.csv"');
      
      // Convert to CSV format
      const csvHeaders = ['ID', 'Full Name', 'NIK', 'KK Number', 'Gender', 'Birth Date', 'Phone', 'Email', 'Address', 'RT Number', 'RW Number', 'Religion', 'Marital Status', 'Occupation', 'Education', 'Emergency Contact', 'Blood Type', 'Is Verified', 'Created At'];
      const csvRows = residents.map(resident => [
        resident.id,
        resident.fullName,
        resident.nik,
        resident.family?.noKK || '',
        resident.gender,
        resident.birthDate?.toISOString().split('T')[0] || '',
        resident.phoneNumber || '',
        resident.user?.email || '',
        resident.address,
        resident.rtNumber,
        resident.rwNumber || '',
        resident.religion || '',
        resident.maritalStatus || '',
        resident.occupation || '',
        resident.education || '',
        '', // Emergency contact not available in schema
        '', // Blood type not available in schema
        resident.isVerified ? 'Yes' : 'No',
        resident.createdAt.toISOString().split('T')[0]
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      res.send(csvContent);
    } else {
      // Default JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="residents.json"');
      
      res.status(200).json({
        status: 'success',
        message: `Successfully exported ${residents.length} residents`,
        data: {
          residents,
          exportedAt: new Date().toISOString(),
          totalCount: residents.length
        },
      });
    }
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

// Get resident documents
export const getResidentDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const residentId = parseInt(req.params.id);
    
    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get resident to get their NIK and noKK for file naming
    const resident = await prisma.resident.findUnique({
      where: { id: residentId }
    });
    
    if (!resident) {
      throw new ApiError('Resident not found', 404);
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // Check if files actually exist on disk
    const uploadsPath = path.join(__dirname, '../../uploads/residents');
    const ktpFilename = `ktp_${resident.nik}.jpg`;
    const kkFilename = `kk_${resident.noKK}.jpg`;
    const ktpPath = path.join(uploadsPath, ktpFilename);
    const kkPath = path.join(uploadsPath, kkFilename);
    
    const documents = [];
    
    // Check KTP file
    if (fs.existsSync(ktpPath)) {
      documents.push({
        id: 1,
        type: 'KTP',
        filename: ktpFilename,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
        fileUrl: `/api/uploads/residents/${ktpFilename}`
      });
    } else {
      documents.push({
        id: 1,
        type: 'KTP',
        filename: ktpFilename,
        uploadedAt: null,
        status: 'not_uploaded',
        fileUrl: null
      });
    }
    
    // Check KK file
    if (fs.existsSync(kkPath)) {
      documents.push({
        id: 2,
        type: 'KK',
        filename: kkFilename,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
        fileUrl: `/api/uploads/residents/${kkFilename}`
      });
    } else {
      documents.push({
        id: 2,
        type: 'KK',
        filename: kkFilename,
        uploadedAt: null,
        status: 'not_uploaded',
        fileUrl: null
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        documents
      }
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

// Get residents pending verification for RT
export const getPendingVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const rtUserId = req.user.id;
    const residents = await residentService.getResidentsPendingVerification(rtUserId);
    
    res.status(200).json({
      status: 'success',
      data: residents,
    });
  } catch (error) {
    next(error);
  }
};

// Verify resident by RT
export const verifyByRT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const residentId = parseInt(req.params.id);
    
    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    const rtUserId = req.user.id;
    
    const verifiedResident = await residentService.verifyResidentByRT(residentId, rtUserId);
    
    res.status(200).json({
      status: 'success',
      message: 'Resident verified successfully',
      data: verifiedResident,
    });
  } catch (error) {
    next(error);
  }
};

// Upload document for resident
export const uploadResidentDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const residentId = parseInt(req.params.id);
    
    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    if (!req.file) {
      throw new ApiError('No file uploaded', 400);
    }
    
    // Get resident to ensure they exist
    const resident = await prisma.resident.findUnique({
      where: { id: residentId }
    });
    
    if (!resident) {
      throw new ApiError('Resident not found', 404);
    }
    
    const { docType } = req.body;
    
    if (!docType || !['ktp', 'kk'].includes(docType.toLowerCase())) {
      throw new ApiError('Document type is required and must be either "ktp" or "kk"', 400);
    }
    
    // File was already saved by multer middleware with correct naming
    const fileUrl = `/api/uploads/residents/${req.file.filename}`;
    
    res.status(200).json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: {
        filename: req.file.filename,
        fileUrl: fileUrl,
        docType: docType,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};
