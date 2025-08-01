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
      // Get RT user's resident profile to find their RT number
      const rtUserResident = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { 
          resident: true,
          rt: true 
        }
      });

      if (!rtUserResident?.resident && !rtUserResident?.rt) {
        return res.status(403).json({ message: 'RT user profile not found' });
      }

      // Get RT number from either resident profile or RT table
      let rtNumber: string | null = null;
      if (rtUserResident.resident) {
        rtNumber = rtUserResident.resident.rtNumber;
      } else if (rtUserResident.rt) {
        rtNumber = rtUserResident.rt.number;
      }

      if (!rtNumber) {
        return res.status(403).json({ message: 'RT number not found in user profile' });
      }

      // Get requester's resident record
      const requesterResident = await prisma.resident.findFirst({
        where: { userId: document.requesterId },
      });

      if (!requesterResident) {
        return res.status(403).json({ message: 'Document requester profile not found' });
      }

      // Check if requester is in RT's area by matching RT number
      if (requesterResident.rtNumber !== rtNumber) {
        return res.status(403).json({ message: 'You can only access documents from residents in your RT area' });
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
      // Get RT user's resident profile to find their RT number
      const rtUserResident = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { 
          resident: true,
          rt: true 
        }
      });

      if (!rtUserResident?.resident && !rtUserResident?.rt) {
        return res.status(403).json({ message: 'RT user profile not found' });
      }

      // Get RT number from either resident profile or RT table
      let rtNumber: string | null = null;
      if (rtUserResident.resident) {
        rtNumber = rtUserResident.resident.rtNumber;
      } else if (rtUserResident.rt) {
        rtNumber = rtUserResident.rt.number;
      }

      if (!rtNumber) {
        return res.status(403).json({ message: 'RT number not found in user profile' });
      }
      
      // Get requester's resident record
      const requesterResident = await prisma.resident.findFirst({
        where: { userId: document.requesterId },
      });
      
      if (!requesterResident) {
        return res.status(403).json({ message: 'Document requester profile not found' });
      }
      
      // Check if requester is in RT's area by matching RT number
      if (requesterResident.rtNumber !== rtNumber) {
        return res.status(403).json({ message: 'You can only process documents from residents in your RT area' });
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