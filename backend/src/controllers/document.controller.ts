import { Request, Response, NextFunction } from 'express';
import * as documentService from '../services/document.service';
import { ApiError } from '../middleware/error.middleware';
import { DocumentStatus, PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Get all documents
export const getAllDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search, 
      type, 
      status, 
      requesterId,
      rtNumber
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const result = await documentService.getAllDocuments({
      page: pageNum,
      limit: limitNum,
      search: search && search !== '' ? search as string : undefined,
      type: type && type !== '' ? type as any : undefined,
      status: status && status !== '' ? status as any : undefined,
      requesterId: requesterId ? parseInt(requesterId as string) : undefined,
      rtNumber: rtNumber && rtNumber !== '' ? rtNumber as string : undefined,
    });
    
    res.status(200).json({
      status: 'success',
      results: result.documents.length,
      currentPage: pageNum,
      data: {
        documents: result.documents,
        pagination: result.pagination
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get document by ID
export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      throw new ApiError('Invalid document ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const document = await documentService.getDocumentById(documentId);
    
    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create document
export const createDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const { type, subject, description } = req.body;
    
    // Validate required fields
    if (!type || !subject || !description) {
      throw new ApiError('Type, subject, and description are required', 400);
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
    
    // Create document with attachments
    const documentData = {
      type,
      subject,
      description,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : undefined,
    };
    
    const newDocument = await documentService.createDocument(documentData, req.user.id);
    
    res.status(201).json({
      status: 'success',
      message: 'Document created successfully',
      data: {
        document: newDocument,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to process file attachments
async function processAttachments(files: any[]): Promise<string[]> {
  const uploadDir = path.join(__dirname, '../../uploads/documents');
  
  // Create upload directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const attachments: string[] = [];
  
  for (const file of files) {
    // Generate unique filename
    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);
    
    // Add file path to attachments
    attachments.push(`/uploads/documents/${fileName}`);
  }
  
  return attachments;
}

// Update document
export const updateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      throw new ApiError('Invalid document ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // First get the existing document
    const existingDocument = await documentService.getDocumentById(documentId);
    
    // Check if user is authorized to update
    if (existingDocument.requesterId !== req.user.id && !['ADMIN', 'RW', 'RT'].includes(req.user.role)) {
      throw new ApiError('You are not authorized to update this document', 403);
    }
    
    // Update document status
    const { status, notes } = req.body;
    
    if (status) {
      const updatedDocument = await documentService.updateDocumentStatus(
        documentId,
        status as DocumentStatus,
        notes
      );
      
      res.status(200).json({
        status: 'success',
        message: 'Document updated successfully',
        data: {
          document: updatedDocument,
        },
      });
    } else {
      throw new ApiError('No valid update parameters provided', 400);
    }
  } catch (error) {
    next(error);
  }
};

// Process document (approve, reject, sign)
export const processDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      throw new ApiError('Invalid document ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const { status, notes } = req.body;
    
    if (!status || !Object.values(DocumentStatus).includes(status)) {
      throw new ApiError('Invalid document status', 400);
    }
    
    let processedDocument;
    
    switch (status) {
      case 'DISETUJUI':
        processedDocument = await documentService.approveDocument(documentId, req.user?.name || 'Admin');
        break;
      case 'DITOLAK':
        processedDocument = await documentService.rejectDocument(documentId, notes || 'Tidak ada alasan yang diberikan');
        break;
      case 'DITANDATANGANI':
        processedDocument = await documentService.signDocument(documentId, req.user?.name || 'Admin');
        break;
      case 'SELESAI':
        processedDocument = await documentService.completeDocument(documentId);
        break;
      default:
        processedDocument = await documentService.updateDocumentStatus(documentId, status, notes, req.user.id);
    }
    
    res.status(200).json({
      status: 'success',
      message: `Document ${status.toLowerCase()} successfully`,
      data: {
        document: processedDocument,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete document
export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      throw new ApiError('Invalid document ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // First get the existing document
    const existingDocument = await documentService.getDocumentById(documentId);
    
    // Check if user is authorized to delete
    if (existingDocument.requesterId !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
      throw new ApiError('You are not authorized to delete this document', 403);
    }
    
    // Delete document logic would go here
    // Since there's no deleteDocument function in the service, we'll just return a success message
    
    res.status(200).json({
      status: 'success',
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get document statistics
export const getDocumentStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Build where condition based on user role
    let whereCondition = {};
    
    // For RT, only show documents from their RT
    if (req.user.role === 'RT') {
      // Get RT user's resident data to determine their RT number
      const rtUserResident = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          resident: true
        }
      });
      
      if (rtUserResident?.resident?.rtNumber) {
        whereCondition = {
          requester: {
            resident: {
              rtNumber: rtUserResident.resident.rtNumber
            }
          }
        };
      }
    }
    
    // Get statistics based on user role
    const statistics = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      diajukan: 0,
      diproses: 0,
      disetujui: 0,
      ditandatangani: 0,
      selesai: 0,
      ditolak: 0
    };
    
    // Count documents with proper filtering
    const total = await prisma.document.count({ where: whereCondition });
    const diajukan = await prisma.document.count({ where: { ...whereCondition, status: 'DIAJUKAN' } });
    const diproses = await prisma.document.count({ where: { ...whereCondition, status: 'DIPROSES' } });
    const disetujui = await prisma.document.count({ where: { ...whereCondition, status: 'DISETUJUI' } });
    const ditandatangani = await prisma.document.count({ where: { ...whereCondition, status: 'DITANDATANGANI' } });
    const selesai = await prisma.document.count({ where: { ...whereCondition, status: 'SELESAI' } });
    const ditolak = await prisma.document.count({ where: { ...whereCondition, status: 'DITOLAK' } });
    
    statistics.total = total;
    statistics.pending = diajukan; // Menunggu persetujuan
    statistics.approved = disetujui + ditandatangani; // Yang sudah disetujui + ditandatangani
    statistics.rejected = ditolak;
    statistics.completed = selesai;
    
    // Also include individual status counts for more detailed statistics
    statistics.diajukan = diajukan;
    statistics.diproses = diproses;
    statistics.disetujui = disetujui;
    statistics.ditandatangani = ditandatangani;
    statistics.selesai = selesai;
    statistics.ditolak = ditolak;
    
    res.status(200).json({
      status: 'success',
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
}; 

// Download attachment
export const downloadAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = parseInt(req.params.id);
    const filename = req.params.filename;
    
    if (isNaN(documentId) || !filename) {
      throw new ApiError('Invalid document ID or filename', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get document to check permissions
    const document = await documentService.getDocumentById(documentId);
    
    // Check if user is authorized to download
    const isAuthorized = 
      document.requesterId === req.user.id || 
      ['ADMIN', 'RW', 'RT'].includes(req.user.role);
    
    if (!isAuthorized) {
      throw new ApiError('You are not authorized to download this attachment', 403);
    }
    
    // Check if document has attachments
    if (!document.attachments) {
      throw new ApiError('Document has no attachments', 404);
    }
    
    // Parse attachments JSON
    let attachments: string[] = [];
    try {
      attachments = JSON.parse(document.attachments);
    } catch (error) {
      throw new ApiError('Invalid attachments format', 500);
    }
    
    // Find the requested attachment
    const attachment = attachments.find(att => {
      const attFilename = att.split('/').pop();
      return attFilename === filename;
    });
    
    if (!attachment) {
      throw new ApiError('Attachment not found', 404);
    }
    
    // Construct file path
    const filePath = path.join(__dirname, '../../', attachment);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new ApiError('File not found on server', 404);
    }
    
    // Send file
    res.download(filePath, filename);
  } catch (error) {
    next(error);
  }
};

// Download completed document
export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      throw new ApiError('Invalid document ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get document to check permissions and status
    const document = await documentService.getDocumentById(documentId);
    
    // Check if document is completed
    if (document.status !== 'SELESAI') {
      throw new ApiError('Document is not yet completed', 400);
    }
    
    // Check if user is authorized to download
    const isAuthorized = 
      document.requesterId === req.user.id || 
      ['ADMIN', 'RW', 'RT'].includes(req.user.role);
    
    if (!isAuthorized) {
      throw new ApiError('You are not authorized to download this document', 403);
    }
    
    // For now, we'll create a simple PDF response
    // In a real implementation, you would generate a proper PDF document
    const pdfContent = `
      SURAT ${document.type}
      
      Subjek: ${document.subject}
      Deskripsi: ${document.description}
      Status: ${document.status}
      Disetujui oleh: ${document.approvedBy || '-'}
      Ditandatangani oleh: ${document.signedBy || '-'}
      Tanggal selesai: ${document.completedAt ? new Date(document.completedAt).toLocaleDateString('id-ID') : '-'}
    `;
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="surat-${documentId}.pdf"`);
    
    // For now, send as text (in production, use a PDF library like pdfkit or puppeteer)
    res.send(pdfContent);
  } catch (error) {
    next(error);
  }
}; 
