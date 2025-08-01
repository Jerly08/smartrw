import { Request, Response, NextFunction } from 'express';
import * as socialAssistanceService from '../services/socialAssistance.service';
import { ApiError } from '../middleware/error.middleware';
import { SocialAssistanceStatus, SocialAssistanceType } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all social assistance programs
export const getAllSocialAssistance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search, 
      type, 
      status,
      startDate, 
      endDate,
      source
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;
    
    if (startDate && !isNaN(Date.parse(startDate as string))) {
      parsedStartDate = new Date(startDate as string);
    }
    
    if (endDate && !isNaN(Date.parse(endDate as string))) {
      parsedEndDate = new Date(endDate as string);
    }
    
    const result = await socialAssistanceService.getAllSocialAssistance({
      page: pageNum,
      limit: limitNum,
      search: search as string,
      type: type as SocialAssistanceType,
      status: status as SocialAssistanceStatus,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      source: source as string
    });
    
    res.status(200).json({
      status: 'success',
      results: result.programs.length,
      totalPages: result.totalPages,
      currentPage: pageNum,
      totalItems: result.totalItems,
      data: {
        programs: result.programs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get social assistance by ID
export const getSocialAssistanceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assistanceId = parseInt(req.params.id);
    
    if (isNaN(assistanceId)) {
      throw new ApiError('Invalid social assistance ID', 400);
    }
    
    const program = await socialAssistanceService.getSocialAssistanceById(assistanceId);
    
    res.status(200).json({
      status: 'success',
      data: {
        program,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create social assistance program
export const createSocialAssistance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const programData = req.body;
    
    const newProgram = await socialAssistanceService.createSocialAssistance(programData);
    
    res.status(201).json({
      status: 'success',
      message: 'Social assistance program created successfully',
      data: {
        program: newProgram,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update social assistance program
export const updateSocialAssistance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const assistanceId = parseInt(req.params.id);
    
    if (isNaN(assistanceId)) {
      throw new ApiError('Invalid social assistance ID', 400);
    }
    
    const programData = req.body;
    
    const updatedProgram = await socialAssistanceService.updateSocialAssistance(assistanceId, programData);
    
    res.status(200).json({
      status: 'success',
      message: 'Social assistance program updated successfully',
      data: {
        program: updatedProgram,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete social assistance program
export const deleteSocialAssistance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const assistanceId = parseInt(req.params.id);
    
    if (isNaN(assistanceId)) {
      throw new ApiError('Invalid social assistance ID', 400);
    }
    
    await socialAssistanceService.deleteSocialAssistance(assistanceId);
    
    res.status(200).json({
      status: 'success',
      message: 'Social assistance program deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get recipients of a social assistance program
export const getSocialAssistanceRecipients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const assistanceId = parseInt(req.params.id);
    
    if (isNaN(assistanceId)) {
      throw new ApiError('Invalid social assistance ID', 400);
    }
    
    const { 
      page = '1', 
      limit = '10', 
      verified,
      rtNumber
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    let parsedVerified: boolean | undefined;
    if (verified !== undefined) {
      parsedVerified = verified === 'true';
    }
    
    const result = await socialAssistanceService.getSocialAssistanceRecipients(
      assistanceId,
      {
        page: pageNum,
        limit: limitNum,
        verified: parsedVerified,
        rtNumber: rtNumber as string
      },
      {
        id: req.user.id,
        role: req.user.role
      }
    );
    
    res.status(200).json({
      status: 'success',
      results: result.recipients.length,
      totalPages: result.totalPages,
      currentPage: pageNum,
      totalItems: result.totalItems,
      data: {
        recipients: result.recipients,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add recipient to a social assistance program
export const addRecipient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const assistanceId = parseInt(req.params.id);
    
    if (isNaN(assistanceId)) {
      throw new ApiError('Invalid social assistance ID', 400);
    }
    
    const { residentId, notes } = req.body;
    
    if (!residentId) {
      throw new ApiError('Resident ID is required', 400);
    }
    
    const recipient = await socialAssistanceService.addSocialAssistanceRecipient(
      assistanceId,
      { residentId, notes },
      {
        id: req.user.id,
        role: req.user.role,
        name: req.user.name
      }
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Recipient added successfully',
      data: {
        recipient,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update recipient information
export const updateRecipient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const assistanceId = parseInt(req.params.assistanceId);
    const recipientId = parseInt(req.params.recipientId);
    
    if (isNaN(assistanceId) || isNaN(recipientId)) {
      throw new ApiError('Invalid ID parameters', 400);
    }
    
    const { notes, isVerified, receivedDate } = req.body;
    
    let parsedReceivedDate: Date | undefined;
    if (receivedDate && !isNaN(Date.parse(receivedDate))) {
      parsedReceivedDate = new Date(receivedDate);
    }
    
    const updatedRecipient = await socialAssistanceService.updateRecipient(
      recipientId,
      {
        notes,
        isVerified,
        receivedDate: parsedReceivedDate
      },
      {
        id: req.user.id,
        role: req.user.role,
        name: req.user.email || `User ${req.user.id}`
      }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Recipient updated successfully',
      data: {
        recipient: updatedRecipient,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove recipient from program
export const removeRecipient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const assistanceId = parseInt(req.params.assistanceId);
    const recipientId = parseInt(req.params.recipientId);
    
    if (isNaN(assistanceId) || isNaN(recipientId)) {
      throw new ApiError('Invalid ID parameters', 400);
    }
    
    await socialAssistanceService.removeRecipient(recipientId);
    
    res.status(200).json({
      status: 'success',
      message: 'Recipient removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update social assistance status
export const updateSocialAssistanceStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const assistanceId = parseInt(req.params.id);
    
    if (isNaN(assistanceId)) {
      throw new ApiError('Invalid social assistance ID', 400);
    }
    
    const { status } = req.body;
    
    if (!status || !['DISIAPKAN', 'DISALURKAN', 'SELESAI'].includes(status)) {
      throw new ApiError('Invalid status', 400);
    }
    
    const updatedProgram = await socialAssistanceService.updateSocialAssistance(assistanceId, { status });
    
    res.status(200).json({
      status: 'success',
      message: 'Social assistance status updated successfully',
      data: {
        program: updatedProgram,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get social assistance statistics
export const getSocialAssistanceStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const statistics = await socialAssistanceService.getSocialAssistanceStatistics({
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

// Export recipients to CSV
export const exportRecipients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assistanceId = parseInt(req.params.id);
    
    if (isNaN(assistanceId)) {
      throw new ApiError('Invalid social assistance ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get program details
    const program = await prisma.socialAssistance.findUnique({
      where: { id: assistanceId },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });
    
    if (!program) {
      throw new ApiError('Social assistance program not found', 404);
    }
    
    // Get recipients with resident details
    const recipients = await prisma.socialAssistanceRecipient.findMany({
      where: {
        socialAssistanceId: assistanceId,
      },
      include: {
        resident: {
          select: {
            fullName: true,
            nik: true,
            phoneNumber: true,
            address: true,
            rtNumber: true,
            rwNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    // Create CSV content
    const csvHeader = [
      'No',
      'Nama Lengkap',
      'NIK',
      'No. Telepon',
      'Alamat',
      'RT',
      'RW',
      'Status Verifikasi',
      'Tanggal Verifikasi',
      'Tanggal Diterima',
      'Catatan',
      'Tanggal Daftar',
    ].join(',');
    
    const csvRows = recipients.map((recipient, index) => {
      const resident = recipient.resident;
      
      return [
        index + 1,
        `"${resident?.fullName || 'N/A'}"`,
        `"${resident?.nik || 'N/A'}"`,
        `"${resident?.phoneNumber || 'N/A'}"`,
        `"${resident?.address || 'N/A'}"`,
        `"${resident?.rtNumber || 'N/A'}"`,
        `"${resident?.rwNumber || 'N/A'}"`,
        `"${recipient.isVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}"`,
        `"${recipient.verifiedAt ? new Date(recipient.verifiedAt).toLocaleDateString('id-ID') : 'N/A'}"`,
        `"${recipient.receivedDate ? new Date(recipient.receivedDate).toLocaleDateString('id-ID') : 'N/A'}"`,
        `"${recipient.notes || 'N/A'}"`,
        `"${new Date(recipient.createdAt).toLocaleDateString('id-ID')}"`,
      ].join(',');
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Set headers for file download
    const fileName = `penerima-${program.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Add BOM for proper UTF-8 encoding in Excel
    res.write('\uFEFF');
    res.end(csvContent);
  } catch (error) {
    next(error);
  }
};

// Check resident eligibility for social assistance
export const checkResidentEligibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const residentId = parseInt(req.params.residentId);
    
    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get resident data
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      include: {
        socialAssistances: true
      }
    });
    
    if (!resident) {
      throw new ApiError('Resident not found', 404);
    }
    
    // Get active social assistance programs
    const activePrograms = await prisma.socialAssistance.findMany({
      where: {
        status: { in: ['DISIAPKAN', 'DISALURKAN'] },
        endDate: { gte: new Date() }
      }
    });
    
    // Check which programs the resident is already enrolled in
    const enrolledProgramIds = resident.socialAssistances.map(sa => sa.socialAssistanceId);
    
    // Filter out programs the resident is already enrolled in
    const eligiblePrograms = activePrograms.filter(program => 
      !enrolledProgramIds.includes(program.id)
    );
    
    // Return eligibility status and eligible programs
    res.status(200).json({
      status: 'success',
      data: {
        isEligible: eligiblePrograms.length > 0,
        eligiblePrograms
      }
    });
  } catch (error) {
    next(error);
  }
}; 