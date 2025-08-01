import { Request, Response, NextFunction } from 'express';
import * as complaintService from '../services/complaint.service';
import { ApiError } from '../middleware/error.middleware';
import { ComplaintCategory, ComplaintStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Get all complaints
export const getAllComplaints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search, 
      category, 
      status,
      startDate, 
      endDate,
      rtNumber,
      rwNumber
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;
    
    if (startDate && typeof startDate === 'string' && startDate.trim() !== '' && !isNaN(Date.parse(startDate))) {
      parsedStartDate = new Date(startDate);
    }
    
    if (endDate && typeof endDate === 'string' && endDate.trim() !== '' && !isNaN(Date.parse(endDate))) {
      parsedEndDate = new Date(endDate);
    }
    
    const result = await complaintService.getAllComplaints({
      page: pageNum,
      limit: limitNum,
      search: search && search !== '' ? search as string : undefined,
      category: category && category !== '' ? category as ComplaintCategory : undefined,
      status: status && status !== '' ? status as ComplaintStatus : undefined,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      rtNumber: rtNumber && rtNumber !== '' ? rtNumber as string : undefined,
      rwNumber: rwNumber && rwNumber !== '' ? rwNumber as string : undefined,
    }, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      results: result.complaints.length,
      totalPages: result.totalPages,
      currentPage: pageNum,
      totalItems: result.totalItems,
      data: {
        complaints: result.complaints,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get complaint by ID
export const getComplaintById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = parseInt(req.params.id);
    
    if (isNaN(complaintId)) {
      throw new ApiError('Invalid complaint ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const complaint = await complaintService.getComplaintById(complaintId, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        complaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create complaint
export const createComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintData = req.body;
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Process file attachments if any
    let attachments: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      // Handle array of files
      attachments = await processAttachments(req.files);
    } else if (req.files && typeof req.files === 'object') {
      // Handle object of files (multer format)
      const fileArray = Object.values(req.files).flat();
      attachments = await processAttachments(fileArray);
    }
    
    // Add attachments to complaint data
    const complaintDataWithAttachments = {
      ...complaintData,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : undefined,
    };
    
    const newComplaint = await complaintService.createComplaint(complaintDataWithAttachments, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Complaint created successfully',
      data: {
        complaint: newComplaint,
      },
    });
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    
    // Handle specific ApiError
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    }
    
    next(error);
  }
};

// Helper function to process file attachments
async function processAttachments(files: any[]): Promise<string[]> {
  const uploadDir = path.join(__dirname, '../../uploads/complaints');
  
  // Create upload directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const attachments: string[] = [];
  
  for (const file of files) {
    // Check if file has buffer (memory storage)
    if (!file.buffer) {
      console.warn('File buffer is undefined, skipping file:', file.originalname);
      continue;
    }
    
    // Generate unique filename
    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);
    
    // Add file path to attachments
    attachments.push(`/uploads/complaints/${fileName}`);
  }
  
  return attachments;
}

// Update complaint
export const updateComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = parseInt(req.params.id);
    
    if (isNaN(complaintId)) {
      throw new ApiError('Invalid complaint ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const complaintData = req.body;
    
    // Process file attachments if any
    let attachments: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      // Handle array of files
      attachments = await processAttachments(req.files);
    } else if (req.files && typeof req.files === 'object') {
      // Handle object of files (multer format)
      const fileArray = Object.values(req.files).flat();
      attachments = await processAttachments(fileArray);
    }
    
    // Add attachments to complaint data if files were uploaded
    const complaintDataWithAttachments = {
      ...complaintData,
      ...(attachments.length > 0 && { attachments: JSON.stringify(attachments) }),
    };
    
    const updatedComplaint = await complaintService.updateComplaint(complaintId, complaintDataWithAttachments, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Complaint updated successfully',
      data: {
        complaint: updatedComplaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete complaint
export const deleteComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = parseInt(req.params.id);
    
    if (isNaN(complaintId)) {
      throw new ApiError('Invalid complaint ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    await complaintService.deleteComplaint(complaintId, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Respond to complaint
export const respondToComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = parseInt(req.params.id);
    
    if (isNaN(complaintId)) {
      throw new ApiError('Invalid complaint ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const { response, status } = req.body;
    
    if (!response || !status) {
      throw new ApiError('Response and status are required', 400);
    }
    
    const validStatuses = ['DITINDAKLANJUTI', 'SELESAI', 'DITOLAK'];
    if (!validStatuses.includes(status)) {
      throw new ApiError('Invalid status', 400);
    }
    
    // Get user details to use as responder name
    const responderName = req.user.email || `User ${req.user.id}`;
    
    const updatedComplaint = await complaintService.respondToComplaint(
      complaintId,
      response,
      status as ComplaintStatus,
      {
        id: req.user.id,
        role: req.user.role,
        name: responderName
      }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Response added successfully',
      data: {
        complaint: updatedComplaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get complaint statistics
export const getComplaintStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const statistics = await complaintService.getComplaintStatistics({
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

// Download complaint attachment
export const downloadAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = parseInt(req.params.id);
    const filename = req.params.filename;
    
    if (isNaN(complaintId)) {
      throw new ApiError('Invalid complaint ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get complaint to check if attachment exists
    const complaint = await complaintService.getComplaintById(complaintId, {
      id: req.user.id,
      role: req.user.role
    });
    
    // Check if complaint has attachments
    if (!complaint.attachments) {
      throw new ApiError('Complaint has no attachments', 404);
    }
    
    // Parse attachments JSON
    const attachments = JSON.parse(complaint.attachments);
    
    // Find the requested attachment
    const attachmentPath = attachments.find((path: string) => path.includes(filename));
    
    if (!attachmentPath) {
      throw new ApiError('Attachment not found', 404);
    }
    
    // Get the file path on disk
    const filePath = path.join(__dirname, '../../', attachmentPath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new ApiError('File not found on server', 404);
    }
    
    // Set content disposition header to force download
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
}; 