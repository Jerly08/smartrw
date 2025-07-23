import { PrismaClient, SocialAssistance, SocialAssistanceType, SocialAssistanceStatus, SocialAssistanceRecipient, Role } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

interface SocialAssistanceQueryParams {
  page: number;
  limit: number;
  search?: string;
  type?: SocialAssistanceType;
  status?: SocialAssistanceStatus;
  startDate?: Date;
  endDate?: Date;
  source?: string;
}

interface CurrentUser {
  id: number;
  role: Role;
  name?: string;
}

// Get all social assistance programs
export const getAllSocialAssistance = async (params: SocialAssistanceQueryParams) => {
  const { page, limit, search, type, status, startDate, endDate, source } = params;
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Build where conditions
  const whereConditions: any = {};
  
  if (search) {
    whereConditions.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { source: { contains: search } },
    ];
  }
  
  if (type) {
    whereConditions.type = type;
  }
  
  if (status) {
    whereConditions.status = status;
  }
  
  if (startDate) {
    whereConditions.startDate = {
      ...(whereConditions.startDate || {}),
      gte: startDate,
    };
  }
  
  if (endDate) {
    whereConditions.endDate = {
      ...(whereConditions.endDate || {}),
      lte: endDate,
    };
  }
  
  if (source) {
    whereConditions.source = { contains: source };
  }
  
  // Get social assistance programs with pagination
  const programs = await prisma.socialAssistance.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      startDate: 'desc',
    },
    include: {
      _count: {
        select: {
          recipients: true,
        }
      }
    }
  });
  
  // Get total count for pagination
  const totalItems = await prisma.socialAssistance.count({
    where: whereConditions,
  });
  
  return {
    programs,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: page,
  };
};

// Get social assistance by ID
export const getSocialAssistanceById = async (id: number) => {
  const program = await prisma.socialAssistance.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          recipients: true,
        }
      }
    }
  });
  
  if (!program) {
    throw new ApiError('Social assistance program not found', 404);
  }
  
  return program;
};

// Create social assistance program
export const createSocialAssistance = async (data: Omit<SocialAssistance, 'id' | 'createdAt' | 'updatedAt'>) => {
  return await prisma.socialAssistance.create({
    data
  });
};

// Update social assistance
export const updateSocialAssistance = async (id: number, data: Partial<SocialAssistance>) => {
  // Check if program exists
  const exists = await prisma.socialAssistance.findUnique({ where: { id } });
  
  if (!exists) {
    throw new ApiError('Social assistance program not found', 404);
  }
  
  return await prisma.socialAssistance.update({
    where: { id },
    data
  });
};

// Delete social assistance
export const deleteSocialAssistance = async (id: number) => {
  // Check if program exists
  const exists = await prisma.socialAssistance.findUnique({ where: { id } });
  
  if (!exists) {
    throw new ApiError('Social assistance program not found', 404);
  }
  
  // Delete recipients first (cascade should handle this, but just in case)
  await prisma.socialAssistanceRecipient.deleteMany({
    where: { socialAssistanceId: id }
  });
  
  return await prisma.socialAssistance.delete({
    where: { id }
  });
};

// Get recipients of a social assistance program
export const getSocialAssistanceRecipients = async (
  assistanceId: number,
  params: { page: number; limit: number; verified?: boolean; rtNumber?: string },
  currentUser: CurrentUser
) => {
  const { page, limit, verified, rtNumber } = params;
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Build where conditions for recipients
  const whereConditions: any = {
    socialAssistanceId: assistanceId
  };
  
  if (verified !== undefined) {
    whereConditions.isVerified = verified;
  }
  
  // Handle role-based filtering
  if (currentUser.role === 'RT') {
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id }
    });
    
    if (!rtResident) {
      throw new ApiError('RT profile not found', 404);
    }
    
    // RT can only see recipients in their RT
    whereConditions.resident = {
      rtNumber: rtResident.rtNumber,
      rwNumber: rtResident.rwNumber
    };
  } else if (currentUser.role === 'WARGA') {
    const resident = await prisma.resident.findFirst({
      where: { userId: currentUser.id }
    });
    
    if (!resident) {
      throw new ApiError('Resident profile not found', 404);
    }
    
    // Warga can only see their own recipient records
    whereConditions.residentId = resident.id;
  } else if (rtNumber) {
    // Admin/RW can filter by RT if provided
    whereConditions.resident = {
      rtNumber
    };
  }
  
  // Get recipients with pagination
  const recipients = await prisma.socialAssistanceRecipient.findMany({
    where: whereConditions,
    include: {
      resident: {
        select: {
          id: true,
          nik: true,
          fullName: true,
          rtNumber: true,
          rwNumber: true,
          address: true,
          phoneNumber: true
        }
      }
    },
    skip,
    take: limit,
    orderBy: [
      { isVerified: 'asc' },
      { resident: { rtNumber: 'asc' } }
    ]
  });
  
  // Get total count for pagination
  const totalItems = await prisma.socialAssistanceRecipient.count({
    where: whereConditions
  });
  
  return {
    recipients,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: page
  };
};

// Add recipient to social assistance program
export const addSocialAssistanceRecipient = async (
  assistanceId: number,
  data: { residentId: number; notes?: string },
  currentUser: CurrentUser
) => {
  // Check if social assistance exists
  const assistance = await prisma.socialAssistance.findUnique({
    where: { id: assistanceId }
  });
  
  if (!assistance) {
    throw new ApiError('Social assistance program not found', 404);
  }
  
  // Check if resident exists
  const resident = await prisma.resident.findUnique({
    where: { id: data.residentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  
  if (!resident) {
    throw new ApiError('Resident not found', 404);
  }
  
  // Check if resident is already a recipient
  const existingRecipient = await prisma.socialAssistanceRecipient.findFirst({
    where: {
      socialAssistanceId: assistanceId,
      residentId: data.residentId
    }
  });
  
  if (existingRecipient) {
    throw new ApiError('Resident is already a recipient of this program', 400);
  }
  
  // Add recipient
  const recipient = await prisma.socialAssistanceRecipient.create({
    data: {
      socialAssistanceId: assistanceId,
      residentId: data.residentId,
      notes: data.notes
    },
    include: {
      resident: true,
      socialAssistance: true
    }
  });
  
  // Create notification for resident if they have a user account
  if (resident.user) {
    await notificationService.createNotification({
      userId: resident.user.id,
      type: 'SOCIAL_ASSISTANCE',
      title: 'Bantuan Sosial',
      message: `Anda terdaftar sebagai calon penerima bantuan ${assistance.name}`,
      priority: 'NORMAL',
      socialAssistanceId: assistanceId,
      data: {
        assistanceName: assistance.name,
        assistanceType: assistance.type,
        assistanceStatus: assistance.status
      }
    });
  }

  // Create notifications for RT users
  await createSocialAssistanceNotificationsForRT(recipient);
  
  return recipient;
};

// Helper function to create notifications for RT users when social assistance needs verification
async function createSocialAssistanceNotificationsForRT(recipient: any) {
  try {
    const { resident, socialAssistance } = recipient;
    
    if (!resident || !socialAssistance) {
      console.error('Recipient data incomplete');
      return;
    }
    
    const { rtNumber, rwNumber } = resident;
    
    // Get all RT users for the recipient's RT
    const rtUsers = await prisma.user.findMany({
      where: {
        role: 'RT',
        resident: {
          rtNumber,
          rwNumber,
        },
      },
    });
    
    // Create notifications for RT users
    for (const rtUser of rtUsers) {
      await prisma.notification.create({
        data: {
          userId: rtUser.id,
          type: 'SOCIAL_ASSISTANCE',
          title: 'Verifikasi Bantuan Sosial',
          message: `Calon penerima bantuan ${socialAssistance.name} memerlukan verifikasi Anda`,
          priority: 'HIGH',
          socialAssistanceId: socialAssistance.id,
          data: JSON.stringify({
            assistanceId: socialAssistance.id,
            assistanceName: socialAssistance.name,
            assistanceType: socialAssistance.type,
            recipientId: recipient.id,
            residentName: resident.fullName,
            residentNik: resident.nik,
            residentAddress: resident.address,
          }),
        },
      });
    }
  } catch (error) {
    console.error('Error creating social assistance notifications for RT:', error);
  }
}

// Update recipient information
export const updateRecipient = async (
  recipientId: number,
  data: {
    notes?: string;
    isVerified?: boolean;
    receivedDate?: Date;
  },
  currentUser: CurrentUser
) => {
  // Check if recipient exists
  const recipient = await prisma.socialAssistanceRecipient.findUnique({
    where: { id: recipientId },
    include: {
      resident: true
    }
  });
  
  if (!recipient) {
    throw new ApiError('Recipient not found', 404);
  }
  
  const updateData: any = { ...data };
  
  // If verifying, add verification info
  if (data.isVerified === true) {
    updateData.verifiedBy = currentUser.name || `User ${currentUser.id}`;
    updateData.verifiedAt = new Date();
  }
  
  return await prisma.socialAssistanceRecipient.update({
    where: { id: recipientId },
    data: updateData,
    include: {
      resident: {
        select: {
          fullName: true,
          nik: true,
          rtNumber: true,
          rwNumber: true
        }
      }
    }
  });
};

// Remove recipient from program
export const removeRecipient = async (recipientId: number) => {
  // Check if recipient exists
  const recipient = await prisma.socialAssistanceRecipient.findUnique({
    where: { id: recipientId }
  });
  
  if (!recipient) {
    throw new ApiError('Recipient not found', 404);
  }
  
  return await prisma.socialAssistanceRecipient.delete({
    where: { id: recipientId }
  });
};

// Get social assistance statistics
export const getSocialAssistanceStatistics = async (currentUser: CurrentUser) => {
  let rtFilter = {};
  
  // If RT, limit to their area
  if (currentUser.role === 'RT') {
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id }
    });
    
    if (!rtResident) {
      throw new ApiError('RT profile not found', 404);
    }
    
    rtFilter = {
      resident: {
        rtNumber: rtResident.rtNumber,
        rwNumber: rtResident.rwNumber
      }
    };
  } else if (currentUser.role === 'WARGA') {
    const resident = await prisma.resident.findFirst({
      where: { userId: currentUser.id }
    });
    
    if (!resident) {
      throw new ApiError('Resident profile not found', 404);
    }
    
    rtFilter = {
      residentId: resident.id
    };
  }
  
  // Total programs
  const totalPrograms = await prisma.socialAssistance.count();
  
  // Active programs
  const activePrograms = await prisma.socialAssistance.count({
    where: {
      status: { in: ['DISIAPKAN', 'DISALURKAN'] },
      endDate: {
        gt: new Date()
      }
    }
  });
  
  // Programs by type
  const programsByType = await prisma.socialAssistance.groupBy({
    by: ['type'],
    _count: {
      id: true
    }
  });
  
  // Programs by status
  const programsByStatus = await prisma.socialAssistance.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  });
  
  // Total recipients
  const totalRecipients = await prisma.socialAssistanceRecipient.count({
    where: rtFilter
  });
  
  // Verified recipients
  const verifiedRecipients = await prisma.socialAssistanceRecipient.count({
    where: {
      ...rtFilter,
      isVerified: true
    }
  });
  
  return {
    programs: {
      total: totalPrograms,
      active: activePrograms,
      byType: programsByType,
      byStatus: programsByStatus
    },
    recipients: {
      total: totalRecipients,
      verified: verifiedRecipients,
      percentVerified: totalRecipients > 0 
        ? Math.round((verifiedRecipients / totalRecipients) * 100) 
        : 0
    }
  };
}; 