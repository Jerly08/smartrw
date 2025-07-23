import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from './error.middleware';

const prisma = new PrismaClient();

// Middleware to check if user can access a specific document
export const checkDocumentAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    // Admin and RW have full access to all documents
    if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
      return next();
    }

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (req.user.role === 'RT') {
      // RT can only access documents from residents in their RT
      const rtResident = await prisma.resident.findFirst({
        where: { userId: req.user.id },
      });

      if (!rtResident) {
        return res.status(403).json({ message: 'RT profile not found' });
      }

      // Get requester's resident record
      const requesterResident = await prisma.resident.findFirst({
        where: { userId: document.requesterId },
      });

      if (!requesterResident) {
        return res.status(403).json({ message: 'Requester profile not found' });
      }

      // Check if requester is in RT's area
      if (requesterResident.rtNumber !== rtResident.rtNumber || 
          requesterResident.rwNumber !== rtResident.rwNumber) {
        return res.status(403).json({ message: 'You can only access documents from residents in your RT' });
      }
    } else if (req.user.role === 'WARGA') {
      // Warga can only access their own documents
      if (document.requesterId !== req.user.id) {
        return res.status(403).json({ message: 'You can only access your own documents' });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking document access' });
  }
};

// Middleware to check if user can process a document
export const checkDocumentProcessAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check based on role and status
    if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
      // Admin and RW can process documents to any status
      // But need to follow the workflow
      switch (status) {
        case 'DIPROSES':
          if (document.status !== 'DIAJUKAN') {
            return res.status(403).json({ message: 'Document must be in DIAJUKAN status to be processed' });
          }
          break;
        case 'DITOLAK':
          if (!['DIAJUKAN', 'DIPROSES'].includes(document.status)) {
            return res.status(403).json({ message: 'Document must be in DIAJUKAN or DIPROSES status to be rejected' });
          }
          break;
        case 'DISETUJUI':
          if (document.status !== 'DIPROSES') {
            return res.status(403).json({ message: 'Document must be in DIPROSES status to be approved' });
          }
          break;
        case 'DITANDATANGANI':
          if (document.status !== 'DISETUJUI') {
            return res.status(403).json({ message: 'Document must be in DISETUJUI status to be signed' });
          }
          break;
        case 'SELESAI':
          if (document.status !== 'DITANDATANGANI') {
            return res.status(403).json({ message: 'Document must be in DITANDATANGANI status to be completed' });
          }
          break;
        default:
          return res.status(400).json({ message: 'Invalid status' });
      }
    } else if (req.user.role === 'RT') {
      // RT can only recommend (DIPROSES) or reject documents
      if (status !== 'DIPROSES' && status !== 'DITOLAK') {
        return res.status(403).json({ message: 'RT can only process or reject documents' });
      }
      
      // Check if document is in the correct state
      if (document.status !== 'DIAJUKAN') {
        return res.status(403).json({ message: 'Document must be in DIAJUKAN status to be processed by RT' });
      }
      
      // Check if document is from a resident in RT's area
      const rtResident = await prisma.resident.findFirst({
        where: { userId: req.user.id },
      });
      
      if (!rtResident) {
        return res.status(403).json({ message: 'RT profile not found' });
      }
      
      // Get requester's resident record
      const requesterResident = await prisma.resident.findFirst({
        where: { userId: document.requesterId },
      });
      
      if (!requesterResident) {
        return res.status(403).json({ message: 'Requester profile not found' });
      }
      
      // Check if requester is in RT's area
      if (requesterResident.rtNumber !== rtResident.rtNumber || 
          requesterResident.rwNumber !== rtResident.rwNumber) {
        return res.status(403).json({ message: 'You can only process documents from residents in your RT' });
      }
    } else {
      // Warga cannot process documents
      return res.status(403).json({ message: 'You do not have permission to process documents' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking document process access' });
  }
}; 