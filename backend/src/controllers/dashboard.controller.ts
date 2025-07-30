import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

// Get RT dashboard statistics
export const getRTDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    // Get RT user's resident record to find their RT and RW numbers
    const rtUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        resident: true,
      },
    });

    if (!rtUser || !rtUser.resident) {
      throw new ApiError('RT profile not found', 404);
    }

    const rtNumber = rtUser.resident.rtNumber;
    const rwNumber = rtUser.resident.rwNumber;

    // Get resident statistics for this RT
    const totalResidents = await prisma.resident.count({
      where: {
        rtNumber,
        rwNumber,
      },
    });

    const verifiedResidents = await prisma.resident.count({
      where: {
        rtNumber,
        rwNumber,
        isVerified: true,
      },
    });

    const totalFamilies = await prisma.family.count({
      where: {
        rtNumber,
        rwNumber,
      },
    });

    // Get document statistics for this RT (pending documents that need RT approval)
    const pendingDocuments = await prisma.document.count({
      where: {
        requester: {
          resident: {
            rtNumber,
            rwNumber,
          },
        },
        status: 'DIAJUKAN',
      },
    });

    const totalDocuments = await prisma.document.count({
      where: {
        requester: {
          resident: {
            rtNumber,
            rwNumber,
          },
        },
      },
    });

    // Get complaint statistics for this RT
    const openComplaints = await prisma.complaint.count({
      where: {
        creator: {
          resident: {
            rtNumber,
            rwNumber,
          },
        },
        status: 'DITERIMA',
      },
    });

    const totalComplaints = await prisma.complaint.count({
      where: {
        creator: {
          resident: {
            rtNumber,
            rwNumber,
          },
        },
      },
    });

    // Get upcoming events for this RT
    const upcomingEvents = await prisma.event.count({
      where: {
        OR: [
          {
            targetRTs: {
              contains: rtNumber,
            },
          },
          {
            targetRTs: null, // Events for all RTs
          },
        ],
        startDate: {
          gte: new Date(),
        },
        isPublished: true,
      },
    });

    const stats = {
      rtNumber,
      rwNumber,
      residents: {
        total: totalResidents,
        verified: verifiedResidents,
        unverified: totalResidents - verifiedResidents,
        families: totalFamilies,
      },
      documents: {
        pending: pendingDocuments,
        total: totalDocuments,
      },
      complaints: {
        open: openComplaints,
        total: totalComplaints,
      },
      events: {
        upcoming: upcomingEvents,
      },
    };

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get pending verifications for RT
export const getRTPendingVerifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { limit = '10', page = '1' } = req.query;
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // Get RT user's resident record
    const rtUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        resident: true,
      },
    });

    if (!rtUser || !rtUser.resident) {
      throw new ApiError('RT profile not found', 404);
    }

    const rtNumber = rtUser.resident.rtNumber;
    const rwNumber = rtUser.resident.rwNumber;

    // Get unverified residents in this RT
    const verifications = await prisma.resident.findMany({
      where: {
        rtNumber,
        rwNumber,
        isVerified: false,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limitNum,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalVerifications = await prisma.resident.count({
      where: {
        rtNumber,
        rwNumber,
        isVerified: false,
      },
    });

    // Format the response to match frontend expectations
    const formattedVerifications = verifications.map((resident) => ({
      id: resident.id,
      residentId: resident.id,
      name: resident.fullName,
      nik: resident.nik,
      address: resident.address,
      rtNumber: resident.rtNumber,
      rwNumber: resident.rwNumber,
      submittedAt: resident.createdAt.toISOString(),
    }));

    res.status(200).json({
      status: 'success',
      data: {
        verifications: formattedVerifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalVerifications,
          totalPages: Math.ceil(totalVerifications / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get pending documents for RT
export const getRTPendingDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { limit = '10', page = '1' } = req.query;
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // Get RT user's resident record
    const rtUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        resident: true,
      },
    });

    if (!rtUser || !rtUser.resident) {
      throw new ApiError('RT profile not found', 404);
    }

    const rtNumber = rtUser.resident.rtNumber;
    const rwNumber = rtUser.resident.rwNumber;

    // Get pending documents in this RT
    const documents = await prisma.document.findMany({
      where: {
        requester: {
          resident: {
            rtNumber,
            rwNumber,
          },
        },
        status: 'DIAJUKAN',
      },
      include: {
        requester: {
          select: {
            name: true,
            resident: {
              select: {
                fullName: true,
                nik: true,
              },
            },
          },
        },
      },
      skip,
      take: limitNum,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalDocuments = await prisma.document.count({
      where: {
        requester: {
          resident: {
            rtNumber,
            rwNumber,
          },
        },
        status: 'DIAJUKAN',
      },
    });

    // Format the response to match frontend expectations
    const formattedDocuments = documents.map((document) => ({
      id: document.id,
      documentId: document.id,
      type: document.type,
      requester: document.requester.resident?.fullName || document.requester.name,
      requesterNik: document.requester.resident?.nik || 'N/A',
      subject: document.subject,
      submittedAt: document.createdAt.toISOString(),
    }));

    res.status(200).json({
      status: 'success',
      data: {
        documents: formattedDocuments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalDocuments,
          totalPages: Math.ceil(totalDocuments / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get upcoming events for RT
export const getRTUpcomingEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { limit = '10', page = '1' } = req.query;
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // Get RT user's resident record
    const rtUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        resident: true,
      },
    });

    if (!rtUser || !rtUser.resident) {
      throw new ApiError('RT profile not found', 404);
    }

    const rtNumber = rtUser.resident.rtNumber;

    // Get upcoming events for this RT
    const events = await prisma.event.findMany({
      where: {
        OR: [
          {
            targetRTs: {
              contains: rtNumber,
            },
          },
          {
            targetRTs: null, // Events for all RTs
          },
        ],
        startDate: {
          gte: new Date(),
        },
        isPublished: true,
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
      skip,
      take: limitNum,
      orderBy: {
        startDate: 'asc',
      },
    });

    const totalEvents = await prisma.event.count({
      where: {
        OR: [
          {
            targetRTs: {
              contains: rtNumber,
            },
          },
          {
            targetRTs: null,
          },
        ],
        startDate: {
          gte: new Date(),
        },
        isPublished: true,
      },
    });

    // Format the response to match frontend expectations
    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.startDate.toISOString(),
      location: event.location,
      participants: event._count.participants,
      isRTEvent: event.targetRTs !== null,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        events: formattedEvents,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalEvents,
          totalPages: Math.ceil(totalEvents / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Process resident verification
export const processVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { action, notes } = req.body;
    const residentId = parseInt(id);

    if (isNaN(residentId)) {
      throw new ApiError('Invalid resident ID', 400);
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      throw new ApiError('Invalid action', 400);
    }

    // Get the resident
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
    });

    if (!resident) {
      throw new ApiError('Resident not found', 404);
    }

    // Get RT user's resident record to verify permissions
    const rtUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        resident: true,
      },
    });

    if (!rtUser || !rtUser.resident) {
      throw new ApiError('RT profile not found', 404);
    }

    // Check if the resident belongs to this RT
    if (resident.rtNumber !== rtUser.resident.rtNumber || resident.rwNumber !== rtUser.resident.rwNumber) {
      throw new ApiError('You can only verify residents in your RT', 403);
    }

    if (action === 'approve') {
      // Approve the resident
      await prisma.resident.update({
        where: { id: residentId },
        data: {
          isVerified: true,
          verifiedBy: req.user.name,
          verifiedAt: new Date(),
        },
      });
    } else {
      // For rejection, you might want to add a notes field or handle differently
      // For now, we'll just leave them unverified
      console.log(`Resident ${residentId} verification rejected: ${notes}`);
    }

    res.status(200).json({
      status: 'success',
      message: `Resident verification ${action}d successfully`,
      data: { success: true },
    });
  } catch (error) {
    next(error);
  }
};

// Process document recommendation
export const processDocumentRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { action, notes } = req.body;
    const documentId = parseInt(id);

    if (isNaN(documentId)) {
      throw new ApiError('Invalid document ID', 400);
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      throw new ApiError('Invalid action', 400);
    }

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        requester: {
          include: {
            resident: true,
          },
        },
      },
    });

    if (!document) {
      throw new ApiError('Document not found', 404);
    }

    // Get RT user's resident record to verify permissions
    const rtUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        resident: true,
      },
    });

    if (!rtUser || !rtUser.resident) {
      throw new ApiError('RT profile not found', 404);
    }

    // Check if the document requester belongs to this RT
    if (!document.requester.resident || 
        document.requester.resident.rtNumber !== rtUser.resident.rtNumber || 
        document.requester.resident.rwNumber !== rtUser.resident.rwNumber) {
      throw new ApiError('You can only process documents from residents in your RT', 403);
    }

    if (action === 'approve') {
      // Approve the document (move to next status)
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'DIPROSES',
          approvedBy: req.user.name,
          approvedAt: new Date(),
          rejectionReason: notes || null,
        },
      });
    } else {
      // Reject the document
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'DITOLAK',
          rejectionReason: notes || 'Ditolak oleh RT',
        },
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Document recommendation ${action}d successfully`,
      data: { success: true },
    });
  } catch (error) {
    next(error);
  }
};
