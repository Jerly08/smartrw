import { PrismaClient, Complaint, ComplaintCategory, ComplaintStatus, Role } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';
import { hasPermission } from '../utils/helpers';

const prisma = new PrismaClient();

interface ComplaintQueryParams {
  page: number;
  limit: number;
  search?: string;
  category?: ComplaintCategory;
  status?: ComplaintStatus;
  startDate?: Date;
  endDate?: Date;
  rtNumber?: string;
  rwNumber?: string;
}

interface CurrentUser {
  id: number;
  role: Role;
  name?: string;
}

// Get all complaints with pagination and filtering
export const getAllComplaints = async (params: ComplaintQueryParams, currentUser: CurrentUser) => {
  const { page, limit, search, category, status, startDate, endDate, rtNumber, rwNumber } = params;
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Build where conditions
  const whereConditions: any = {};
  
  if (search) {
    whereConditions.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { location: { contains: search } },
    ];
  }
  
  if (category) {
    whereConditions.category = category;
  }
  
  if (status) {
    whereConditions.status = status;
  }
  
  if (startDate) {
    whereConditions.createdAt = {
      ...(whereConditions.createdAt || {}),
      gte: startDate,
    };
  }
  
  if (endDate) {
    whereConditions.createdAt = {
      ...(whereConditions.createdAt || {}),
      lte: endDate,
    };
  }
  
  // Apply role-based filtering
  if (currentUser.role === 'RT') {
    // RT can only see complaints from their RT
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!rtResident) {
      throw new ApiError('RT profile not found', 404);
    }
    
    // Get all users from the RT's area
    const rtUsers = await prisma.resident.findMany({
      where: { 
        rtNumber: rtResident.rtNumber,
        rwNumber: rtResident.rwNumber
      },
      select: { userId: true },
    });
    
    const rtUserIds = rtUsers.map(user => user.userId);
    
    // Filter complaints by RT's users
    whereConditions.OR = [
      { createdBy: { in: rtUserIds } },
    ];
    
    // If rtNumber is specified, it must match the RT's rtNumber
    if (rtNumber && rtNumber !== rtResident.rtNumber) {
      throw new ApiError('RT can only access complaints for their own RT', 403);
    }
    
    // If rwNumber is specified, it must match the RT's rwNumber
    if (rwNumber && rwNumber !== rtResident.rwNumber) {
      throw new ApiError('RT can only access complaints for their own RW', 403);
    }
  } else if (currentUser.role === 'WARGA') {
    // Warga can only see their own complaints
    whereConditions.createdBy = currentUser.id;
    
    // Ignore rtNumber and rwNumber filters for Warga
  } else {
    // Admin and RW can see all complaints
    // Apply optional filters if provided
    if (rtNumber || rwNumber) {
      // Get all users from the specified RT/RW
      const residentsQuery: any = {};
      
      if (rtNumber) {
        residentsQuery.rtNumber = rtNumber;
      }
      
      if (rwNumber) {
        residentsQuery.rwNumber = rwNumber;
      }
      
      const residents = await prisma.resident.findMany({
        where: residentsQuery,
        select: { userId: true },
      });
      
      const userIds = residents.map(resident => resident.userId);
      
      // Filter complaints by users in the specified RT/RW
      whereConditions.createdBy = { in: userIds };
    }
  }
  
  // Get complaints with pagination
  const complaints = await prisma.complaint.findMany({
    where: whereConditions,
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          resident: {
            select: {
              rtNumber: true,
              rwNumber: true,
              fullName: true,
            },
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  // Get total count for pagination
  const totalItems = await prisma.complaint.count({
    where: whereConditions,
  });
  
  return {
    complaints,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: page,
  };
};

// Get complaint by ID
export const getComplaintById = async (id: number, currentUser: CurrentUser) => {
  // Check if complaint exists
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          resident: {
            select: {
              rtNumber: true,
              rwNumber: true,
              fullName: true,
            },
          },
        },
      },
    },
  });
  
  if (!complaint) {
    throw new ApiError('Complaint not found', 404);
  }
  
  // Check if user has permission to view this complaint
  const canAccess = await canAccessComplaint(id, currentUser);
  
  if (!canAccess) {
    throw new ApiError('You do not have permission to view this complaint', 403);
  }
  
  return complaint;
};

// Create complaint
export const createComplaint = async (data: Partial<Complaint>, currentUser: CurrentUser) => {
  // Set the creator ID to the current user
  const complaintData = {
    ...data,
    createdBy: currentUser.id,
    status: 'DITERIMA' as ComplaintStatus,
  };
  
  // Create complaint
  const complaint = await prisma.complaint.create({
    data: complaintData as any,
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
  
  // Create notification for RT and RW
  await createComplaintNotifications(complaint);
  
  return complaint;
};

// Update complaint
export const updateComplaint = async (id: number, data: Partial<Complaint>, currentUser: CurrentUser) => {
  // Check if complaint exists
  const existingComplaint = await prisma.complaint.findUnique({
    where: { id },
  });
  
  if (!existingComplaint) {
    throw new ApiError('Complaint not found', 404);
  }
  
  // Check if user has permission to update this complaint
  const canUpdate = await canUpdateComplaint(id, currentUser);
  
  if (!canUpdate) {
    throw new ApiError('You do not have permission to update this complaint', 403);
  }
  
  // Warga can only update their own complaints if they are still in DITERIMA status
  if (currentUser.role === 'WARGA' && existingComplaint.status !== 'DITERIMA') {
    throw new ApiError('You cannot update a complaint that is already being processed', 403);
  }
  
  // Update complaint
  const updatedComplaint = await prisma.complaint.update({
    where: { id },
    data: data as any,
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
  
  return updatedComplaint;
};

// Delete complaint
export const deleteComplaint = async (id: number, currentUser: CurrentUser) => {
  // Check if complaint exists
  const existingComplaint = await prisma.complaint.findUnique({
    where: { id },
  });
  
  if (!existingComplaint) {
    throw new ApiError('Complaint not found', 404);
  }
  
  // Check if user has permission to delete this complaint
  const canDelete = await canDeleteComplaint(id, currentUser);
  
  if (!canDelete) {
    throw new ApiError('You do not have permission to delete this complaint', 403);
  }
  
  // Delete complaint
  await prisma.complaint.delete({
    where: { id },
  });
  
  return true;
};

// Respond to complaint
export const respondToComplaint = async (
  id: number,
  response: string,
  status: ComplaintStatus,
  currentUser: CurrentUser
) => {
  // Check if complaint exists
  const existingComplaint = await prisma.complaint.findUnique({
    where: { id },
  });
  
  if (!existingComplaint) {
    throw new ApiError('Complaint not found', 404);
  }
  
  // Check if user has permission to respond to this complaint
  const canRespond = await canRespondToComplaint(id, currentUser);
  
  if (!canRespond) {
    throw new ApiError('You do not have permission to respond to this complaint', 403);
  }
  
  // Get the responder's name
  const responderName = currentUser.name || `User ${currentUser.id}`;
  
  // Update complaint with response
  const updatedComplaint = await prisma.complaint.update({
    where: { id },
    data: {
      response,
      status,
      respondedBy: responderName,
      respondedAt: new Date(),
    },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
  
  // Create notification for the complaint creator
  await createResponseNotification(updatedComplaint);
  
  return updatedComplaint;
};

// Get complaint statistics
export const getComplaintStatistics = async (currentUser: CurrentUser) => {
  let whereConditions: any = {};
  
  // Apply role-based filtering
  if (currentUser.role === 'RT') {
    // RT can only see statistics for their RT
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!rtResident) {
      throw new ApiError('RT profile not found', 404);
    }
    
    // Get all users from the RT's area
    const rtUsers = await prisma.resident.findMany({
      where: { 
        rtNumber: rtResident.rtNumber,
        rwNumber: rtResident.rwNumber
      },
      select: { userId: true },
    });
    
    const rtUserIds = rtUsers.map(user => user.userId);
    
    // Filter complaints by RT's users
    whereConditions.createdBy = { in: rtUserIds };
  } else if (currentUser.role === 'WARGA') {
    // Warga can only see statistics for their own complaints
    whereConditions.createdBy = currentUser.id;
  }
  // Admin and RW can see all statistics
  
  // Get total complaints
  const totalComplaints = await prisma.complaint.count({
    where: whereConditions,
  });
  
  // Get complaints by status
  const [diterima, ditindaklanjuti, selesai, ditolak] = await Promise.all([
    prisma.complaint.count({
      where: {
        ...whereConditions,
        status: 'DITERIMA',
      },
    }),
    prisma.complaint.count({
      where: {
        ...whereConditions,
        status: 'DITINDAKLANJUTI',
      },
    }),
    prisma.complaint.count({
      where: {
        ...whereConditions,
        status: 'SELESAI',
      },
    }),
    prisma.complaint.count({
      where: {
        ...whereConditions,
        status: 'DITOLAK',
      },
    }),
  ]);
  
  // Get complaints by category
  const [lingkungan, keamanan, sosial, infrastruktur, administrasi, lainnya] = await Promise.all([
    prisma.complaint.count({
      where: {
        ...whereConditions,
        category: 'LINGKUNGAN',
      },
    }),
    prisma.complaint.count({
      where: {
        ...whereConditions,
        category: 'KEAMANAN',
      },
    }),
    prisma.complaint.count({
      where: {
        ...whereConditions,
        category: 'SOSIAL',
      },
    }),
    prisma.complaint.count({
      where: {
        ...whereConditions,
        category: 'INFRASTRUKTUR',
      },
    }),
    prisma.complaint.count({
      where: {
        ...whereConditions,
        category: 'ADMINISTRASI',
      },
    }),
    prisma.complaint.count({
      where: {
        ...whereConditions,
        category: 'LAINNYA',
      },
    }),
  ]);
  
  // Get monthly data for the last 6 months
  const monthlyData = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const count = await prisma.complaint.count({
      where: {
        ...whereConditions,
        createdAt: {
          gte: month,
          lte: nextMonth,
        },
      },
    });
    
    monthlyData.push({
      month: month.toLocaleString('default', { month: 'long' }),
      year: month.getFullYear(),
      count,
    });
  }
  
  return {
    totalComplaints,
    byStatus: {
      diterima,
      ditindaklanjuti,
      selesai,
      ditolak,
    },
    byCategory: {
      lingkungan,
      keamanan,
      sosial,
      infrastruktur,
      administrasi,
      lainnya,
    },
    monthlyDistribution: monthlyData,
  };
};

// Helper function to check if a user can access a specific complaint
async function canAccessComplaint(complaintId: number, currentUser: CurrentUser): Promise<boolean> {
  // Admin and RW can access all complaints
  if (hasPermission(currentUser.role, 'RW')) {
    return true;
  }
  
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
    return false;
  }
  
  // Creator can always access their own complaints
  if (complaint.createdBy === currentUser.id) {
    return true;
  }
  
  // RT can access complaints from their RT
  if (currentUser.role === 'RT') {
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!rtResident) {
      return false;
    }
    
    // Check if complaint creator is from RT's area
    if (complaint.creator?.resident?.rtNumber === rtResident.rtNumber &&
        complaint.creator?.resident?.rwNumber === rtResident.rwNumber) {
      return true;
    }
  }
  
  // Warga can only access their own complaints
  return false;
}

// Helper function to check if a user can update a specific complaint
async function canUpdateComplaint(complaintId: number, currentUser: CurrentUser): Promise<boolean> {
  // Admin and RW can update all complaints
  if (hasPermission(currentUser.role, 'RW')) {
    return true;
  }
  
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });
  
  if (!complaint) {
    return false;
  }
  
  // Creator can update their own complaints
  if (complaint.createdBy === currentUser.id) {
    return true;
  }
  
  // RT can update complaints from their RT
  if (currentUser.role === 'RT') {
    return await canAccessComplaint(complaintId, currentUser);
  }
  
  return false;
}

// Helper function to check if a user can delete a specific complaint
async function canDeleteComplaint(complaintId: number, currentUser: CurrentUser): Promise<boolean> {
  // Only Admin and RW can delete complaints
  if (hasPermission(currentUser.role, 'RW')) {
    return true;
  }
  
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });
  
  if (!complaint) {
    return false;
  }
  
  // Creator can delete their own complaints if they are still in DITERIMA status
  if (complaint.createdBy === currentUser.id && complaint.status === 'DITERIMA') {
    return true;
  }
  
  return false;
}

// Helper function to check if a user can respond to a specific complaint
async function canRespondToComplaint(complaintId: number, currentUser: CurrentUser): Promise<boolean> {
  // Only Admin, RW, and RT can respond to complaints
  if (currentUser.role === 'WARGA') {
    return false;
  }
  
  // Admin and RW can respond to all complaints
  if (hasPermission(currentUser.role, 'RW')) {
    return true;
  }
  
  // RT can respond to complaints from their RT
  if (currentUser.role === 'RT') {
    return await canAccessComplaint(complaintId, currentUser);
  }
  
  return false;
}

// Helper function to create notifications for new complaints
async function createComplaintNotifications(complaint: Complaint) {
  try {
    // Get the complaint creator's RT and RW
    const complaintCreator = await prisma.user.findUnique({
      where: { id: complaint.createdBy },
      include: {
        resident: true,
      },
    });
    
    if (!complaintCreator?.resident) {
      return;
    }
    
    // Get all RT users for the creator's RT
    const rtUsers = await prisma.user.findMany({
      where: {
        role: 'RT',
        resident: {
          rtNumber: complaintCreator.resident.rtNumber,
          rwNumber: complaintCreator.resident.rwNumber,
        },
      },
    });
    
    // Get all RW users
    const rwUsers = await prisma.user.findMany({
      where: {
        role: 'RW',
      },
    });
    
    // Create notifications for RT users
    for (const rtUser of rtUsers) {
      await prisma.notification.create({
        data: {
          userId: rtUser.id,
          type: 'COMPLAINT',
          title: 'New Complaint Submitted',
          message: `A new complaint has been submitted: ${complaint.title}`,
          data: JSON.stringify({ complaintId: complaint.id }),
        },
      });
    }
    
    // Create notifications for RW users
    for (const rwUser of rwUsers) {
      await prisma.notification.create({
        data: {
          userId: rwUser.id,
          type: 'COMPLAINT',
          title: 'New Complaint Submitted',
          message: `A new complaint has been submitted: ${complaint.title}`,
          data: JSON.stringify({ complaintId: complaint.id }),
        },
      });
    }
  } catch (error) {
    console.error('Error creating complaint notifications:', error);
  }
}

// Helper function to create notification for complaint response
async function createResponseNotification(complaint: Complaint) {
  try {
    // Create notification for the complaint creator
    await prisma.notification.create({
      data: {
        userId: complaint.createdBy,
        type: 'COMPLAINT',
        title: 'Complaint Updated',
        message: `Your complaint "${complaint.title}" has been updated to ${complaint.status}`,
        data: JSON.stringify({ complaintId: complaint.id }),
      },
    });
  } catch (error) {
    console.error('Error creating response notification:', error);
  }
} 