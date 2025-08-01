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
    const possibleExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    
    const documents = [];
    
    // Check KTP file with multiple possible extensions
    let ktpFound = false;
    let ktpFileInfo = null;
    
    for (const ext of possibleExtensions) {
      const ktpFilename = `ktp_${resident.nik}${ext}`;
      const ktpPath = path.join(uploadsPath, ktpFilename);
      
      if (fs.existsSync(ktpPath)) {
        const stats = fs.statSync(ktpPath);
        ktpFileInfo = {
          id: 1,
          type: 'KTP',
          filename: ktpFilename,
          uploadedAt: stats.mtime.toISOString(),
          status: 'uploaded',
          fileUrl: `/api/uploads/residents/${ktpFilename}`
        };
        ktpFound = true;
        break;
      }
    }
    
    if (ktpFound && ktpFileInfo) {
      documents.push(ktpFileInfo);
    } else {
      documents.push({
        id: 1,
        type: 'KTP',
        filename: `ktp_${resident.nik}.jpg`,
        uploadedAt: null,
        status: 'not_uploaded',
        fileUrl: null
      });
    }
    
    // Check KK file with multiple possible extensions
    let kkFound = false;
    let kkFileInfo = null;
    
    for (const ext of possibleExtensions) {
      const kkFilename = `kk_${resident.noKK}${ext}`;
      const kkPath = path.join(uploadsPath, kkFilename);
      
      if (fs.existsSync(kkPath)) {
        const stats = fs.statSync(kkPath);
        kkFileInfo = {
          id: 2,
          type: 'KK',
          filename: kkFilename,
          uploadedAt: stats.mtime.toISOString(),
          status: 'uploaded',
          fileUrl: `/api/uploads/residents/${kkFilename}`
        };
        kkFound = true;
        break;
      }
    }
    
    if (kkFound && kkFileInfo) {
      documents.push(kkFileInfo);
    } else {
      documents.push({
        id: 2,
        type: 'KK',
        filename: `kk_${resident.noKK}.jpg`,
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

// Download resident document
export const downloadResidentDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const residentId = parseInt(req.params.id);
    const { filename } = req.params;
    
    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get resident to verify they exist and get their NIK/noKK
    const resident = await prisma.resident.findUnique({
      where: { id: residentId }
    });
    
    if (!resident) {
      throw new ApiError('Resident not found', 404);
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // Validate filename format and security
    const validFilenamePattern = /^(ktp|kk)_(\d+)\.(jpg|jpeg|png|pdf)$/i;
    if (!validFilenamePattern.test(filename)) {
      throw new ApiError('Invalid filename format', 400);
    }
    
    // Verify the filename matches the resident's NIK or noKK
    const isKtpFile = filename.startsWith(`ktp_${resident.nik}`);
    const isKkFile = filename.startsWith(`kk_${resident.noKK}`);
    
    if (!isKtpFile && !isKkFile) {
      throw new ApiError('Filename does not match resident data', 403);
    }
    
    // Check if file exists
    const uploadsPath = path.join(__dirname, '../../uploads/residents');
    const filePath = path.join(uploadsPath, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new ApiError('Document not found', 404);
    }
    
    // Set appropriate headers for download
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
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

// Get residents for specific RT - used in RT dashboard
export const getResidentsForRT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const { page = '1', limit = '10', search } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    const rtUserId = req.user.id;
    
    const result = await residentService.getResidentsForRT(rtUserId, {
      page: pageNum,
      limit: limitNum,
      search: search as string,
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
