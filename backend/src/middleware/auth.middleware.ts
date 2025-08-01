import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: Role;
        name?: string;
      };
    }
  }
}

// Verify JWT token middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Invalid token format.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    // Use a simpler approach for JWT verification
    const decoded = jwt.verify(token, jwtSecret) as { id: number; email: string; role: Role; name?: string };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: user.name // Include the user's name from the database
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
export const authorize = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }

    next();
  };
};

// Resident-specific access control middleware
export const checkResidentAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const residentId = parseInt(req.params.id);
    
    if (isNaN(residentId)) {
      return res.status(400).json({ message: 'Invalid resident ID' });
    }

    // Admin and RW have full access to all residents
    if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
      return next();
    }

    // Get the target resident
    const targetResident = await prisma.resident.findUnique({
      where: { id: residentId },
    });

    if (!targetResident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

  if (req.user.role === 'RT') {
    // RT can access residents in their RT area or residents who registered under their RT
    const rtUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        resident: true
      }
    });

    if (!rtUser || !rtUser.resident) {
      return res.status(403).json({ message: 'RT profile not found' });
    }

    // Check if the target resident is in their RT area OR if the resident selected this RT during registration
    const isInRTArea = targetResident.rtNumber === rtUser.resident.rtNumber && 
                       targetResident.rwNumber === rtUser.resident.rwNumber;
    
    // Also check if this resident was registered/verified by this RT user
    const isRegisteredByRT = await prisma.resident.findFirst({
      where: {
        id: residentId,
        OR: [
          {
            // Direct RT area match
            rtNumber: rtUser.resident.rtNumber,
            rwNumber: rtUser.resident.rwNumber
          },
          {
            // Or resident chose this RT during verification
            rt: {
              number: rtUser.resident.rtNumber.toString()
            }
          }
        ]
      },
      include: {
        rt: true
      }
    });
    
    if (!isInRTArea && !isRegisteredByRT) {
      return res.status(403).json({ message: 'You can only access residents in your RT area or those registered under your RT' });
    }
    } else if (req.user.role === 'WARGA') {
      // Warga can only access their own record and family members
      const wargaResident = await prisma.resident.findFirst({
        where: { userId: req.user.id },
      });

      if (!wargaResident) {
        return res.status(403).json({ message: 'Resident profile not found' });
      }

      // Check if it's their own record
      if (wargaResident.id === residentId) {
        return next();
      }

      // Check if it's a family member
      if (wargaResident.familyId && wargaResident.familyId === targetResident.familyId) {
        return next();
      }

      return res.status(403).json({ message: 'You can only access your own record and family members' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking resident access' });
  }
}; 