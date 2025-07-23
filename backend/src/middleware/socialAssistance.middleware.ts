import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { ApiError } from './error.middleware';

const prisma = new PrismaClient();

// Check if user can access a social assistance program
export const checkSocialAssistanceAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const assistanceId = parseInt(req.params.id);
    
    if (isNaN(assistanceId)) {
      throw new ApiError('Invalid social assistance ID', 400);
    }

    // Admin and RW have full access
    if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
      return next();
    }

    // Check if the assistance program exists
    const assistance = await prisma.socialAssistance.findUnique({
      where: { id: assistanceId },
    });

    if (!assistance) {
      throw new ApiError('Social assistance program not found', 404);
    }

    // All roles can view published assistance programs
    if (req.method === 'GET') {
      return next();
    }

    // Only Admin and RW can modify assistance programs (handled by the authorize middleware)
    throw new ApiError('You do not have permission to modify this resource', 403);
  } catch (error) {
    next(error);
  }
};

// Check if user can access a recipient
export const checkRecipientAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const assistanceId = parseInt(req.params.assistanceId);
    const recipientId = parseInt(req.params.recipientId);
    
    if (isNaN(assistanceId) || isNaN(recipientId)) {
      throw new ApiError('Invalid ID parameters', 400);
    }

    // Admin and RW have full access
    if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
      return next();
    }

    // Check if the recipient record exists
    const recipient = await prisma.socialAssistanceRecipient.findFirst({
      where: {
        id: recipientId,
        socialAssistanceId: assistanceId
      },
      include: {
        resident: true
      }
    });

    if (!recipient) {
      throw new ApiError('Recipient record not found', 404);
    }

    if (req.user.role === 'RT') {
      // Get RT's assigned area
      const rtResident = await prisma.resident.findFirst({
        where: { userId: req.user.id },
      });

      if (!rtResident) {
        throw new ApiError('RT profile not found', 404);
      }

      // RT can only access/verify recipients in their RT
      if (recipient.resident.rtNumber === rtResident.rtNumber &&
          recipient.resident.rwNumber === rtResident.rwNumber) {
        return next();
      }
      
      throw new ApiError('You can only access recipients in your RT', 403);
    } else if (req.user.role === 'WARGA') {
      // Warga can only view their own assistance records
      const resident = await prisma.resident.findFirst({
        where: { userId: req.user.id },
      });

      if (!resident) {
        throw new ApiError('Resident profile not found', 404);
      }

      if (recipient.residentId === resident.id) {
        // Warga can only view, not modify
        if (req.method === 'GET') {
          return next();
        }
      }
      
      throw new ApiError('You can only view your own assistance records', 403);
    }

    throw new ApiError('You do not have permission to access this resource', 403);
  } catch (error) {
    next(error);
  }
};

// Check if user can verify recipients (Admin, RW, or RT for their area)
export const checkVerificationAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const assistanceId = parseInt(req.params.assistanceId);
    const recipientId = parseInt(req.params.recipientId);
    
    if (isNaN(assistanceId) || isNaN(recipientId)) {
      throw new ApiError('Invalid ID parameters', 400);
    }

    // Admin and RW have full access
    if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
      return next();
    }

    if (req.user.role === 'RT') {
      // Get recipient's details
      const recipient = await prisma.socialAssistanceRecipient.findFirst({
        where: {
          id: recipientId,
          socialAssistanceId: assistanceId
        },
        include: {
          resident: true
        }
      });

      if (!recipient) {
        throw new ApiError('Recipient record not found', 404);
      }

      // Get RT's assigned area
      const rtResident = await prisma.resident.findFirst({
        where: { userId: req.user.id },
      });

      if (!rtResident) {
        throw new ApiError('RT profile not found', 404);
      }

      // RT can only verify recipients in their RT
      if (recipient.resident.rtNumber === rtResident.rtNumber &&
          recipient.resident.rwNumber === rtResident.rwNumber) {
        return next();
      }
    }

    throw new ApiError('You do not have permission to verify this recipient', 403);
  } catch (error) {
    next(error);
  }
}; 