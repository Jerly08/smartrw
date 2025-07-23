import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware to check if user can access a specific complaint
export const checkComplaintAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const complaintId = parseInt(req.params.id);
    
    if (isNaN(complaintId)) {
      return res.status(400).json({ message: 'Invalid complaint ID' });
    }

    // Admin and RW have full access to all complaints
    if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
      return next();
    }

    // Get the complaint
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        creator: {
          include: {
            resident: true,
          },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Creator can always access their own complaints
    if (complaint.createdBy === req.user.id) {
      return next();
    }

    // RT can access complaints from their RT
    if (req.user.role === 'RT') {
      // Get RT's RT and RW numbers
      const rtResident = await prisma.resident.findFirst({
        where: { userId: req.user.id },
      });

      if (!rtResident) {
        return res.status(403).json({ message: 'RT profile not found' });
      }

      // Check if complaint creator is from RT's area
      if (complaint.creator?.resident?.rtNumber === rtResident.rtNumber &&
          complaint.creator?.resident?.rwNumber === rtResident.rwNumber) {
        return next();
      }
    }

    return res.status(403).json({ message: 'You do not have permission to access this complaint' });
  } catch (error) {
    return res.status(500).json({ message: 'Error checking complaint access' });
  }
};

// Middleware to check if user can update a specific complaint
export const checkComplaintUpdateAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const complaintId = parseInt(req.params.id);
    
    if (isNaN(complaintId)) {
      return res.status(400).json({ message: 'Invalid complaint ID' });
    }

    // Admin and RW have full access to all complaints
    if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
      return next();
    }

    // Get the complaint
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Creator can update their own complaints
    if (complaint.createdBy === req.user.id) {
      // Warga can only update their own complaints if they are still in DITERIMA status
      if (req.user.role === 'WARGA' && complaint.status !== 'DITERIMA') {
        return res.status(403).json({ message: 'You cannot update a complaint that is already being processed' });
      }
      return next();
    }

    // RT can update complaints from their RT
    if (req.user.role === 'RT') {
      // Check if complaint creator is from RT's area
      await checkComplaintAccess(req, res, next);
      return;
    }

    return res.status(403).json({ message: 'You do not have permission to update this complaint' });
  } catch (error) {
    return res.status(500).json({ message: 'Error checking complaint update access' });
  }
};

// Middleware to check if user can respond to a specific complaint
export const checkComplaintRespondAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Only Admin, RW, and RT can respond to complaints
    if (req.user.role === 'WARGA') {
      return res.status(403).json({ message: 'Only administrators can respond to complaints' });
    }

    const complaintId = parseInt(req.params.id);
    
    if (isNaN(complaintId)) {
      return res.status(400).json({ message: 'Invalid complaint ID' });
    }

    // Admin and RW have full access to all complaints
    if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
      return next();
    }

    // RT can respond to complaints from their RT
    if (req.user.role === 'RT') {
      // Check if complaint creator is from RT's area
      await checkComplaintAccess(req, res, next);
      return;
    }

    return res.status(403).json({ message: 'You do not have permission to respond to this complaint' });
  } catch (error) {
    return res.status(500).json({ message: 'Error checking complaint respond access' });
  }
}; 