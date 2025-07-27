import { PrismaClient, Resident, Role } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';
import { hasPermission } from '../utils/helpers';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

interface ResidentQueryParams {
  page: number;
  limit: number;
  search?: string;
  rtNumber?: string;
  rwNumber?: string;
}

interface ExportQueryParams {
  search?: string;
  rtNumber?: string;
  rwNumber?: string;
}

interface CurrentUser {
  id: number;
  role: Role;
}

// Get all residents with pagination and filtering
export const getAllResidents = async (params: ResidentQueryParams, currentUser: CurrentUser) => {
  const { page, limit, search, rtNumber, rwNumber } = params;
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Build where conditions
  const whereConditions: any = {};
  
  if (search) {
    whereConditions.OR = [
      { fullName: { contains: search } },
      { nik: { contains: search } },
      { noKK: { contains: search } },
    ];
  }
  
  // Apply role-based filtering
  if (currentUser.role === 'RT') {
    // RT can only see residents in their RT
    // First, get the RT's resident record to find their RT number
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!rtResident) {
      throw new ApiError('RT profile not found', 404);
    }
    
    whereConditions.rtNumber = rtResident.rtNumber;
    whereConditions.rwNumber = rtResident.rwNumber;
  } else if (currentUser.role === 'WARGA') {
    // Warga can only see their own record and family members
    const wargaResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
      include: { family: true },
    });
    
    if (!wargaResident) {
      throw new ApiError('Resident profile not found', 404);
    }
    
    // If warga has family, they can see family members, otherwise just themselves
    if (wargaResident.familyId) {
      whereConditions.OR = [
        { id: wargaResident.id },
        { familyId: wargaResident.familyId },
      ];
    } else {
      whereConditions.id = wargaResident.id;
    }
  } else {
    // Admin and RW can see all residents
    // Apply optional filters if provided
    if (rtNumber) {
      whereConditions.rtNumber = rtNumber;
    }
    
    if (rwNumber) {
      whereConditions.rwNumber = rwNumber;
    }
  }
  
  // Get residents with pagination
  const residents = await prisma.resident.findMany({
    where: whereConditions,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      family: true,
    },
    skip,
    take: limit,
    orderBy: {
      fullName: 'asc',
    },
  });
  
  // Get total count for pagination
  const totalItems = await prisma.resident.count({
    where: whereConditions,
  });
  
  return {
    residents,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
};

// Get resident by ID
export const getResidentById = async (id: number, currentUser: CurrentUser) => {
  // Check if user has permission to view this resident
  const canAccess = await canAccessResident(id, currentUser);
  
  if (!canAccess) {
    throw new ApiError('You do not have permission to view this resident', 403);
  }
  
  const resident = await prisma.resident.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      family: true,
      socialAssistances: {
        include: {
          socialAssistance: true,
        },
      },
    },
  });
  
  if (!resident) {
    throw new ApiError('Resident not found', 404);
  }
  
  return resident;
};

// Create resident
export const createResident = async (data: Partial<Resident>, currentUser: CurrentUser) => {
  // Only RT, RW, and ADMIN can create residents
  if (!hasPermission(currentUser.role, 'RT')) {
    throw new ApiError('You do not have permission to create residents', 403);
  }
  
  // Check if NIK already exists
  if (data.nik) {
    const existingResident = await prisma.resident.findUnique({
      where: { nik: data.nik },
    });
    
    if (existingResident) {
      throw new ApiError('Resident with this NIK already exists', 400);
    }
  }
  
  // If RT is creating, restrict to their RT
  if (currentUser.role === 'RT') {
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!rtResident) {
      throw new ApiError('RT profile not found', 404);
    }
    
    // Force the RT and RW numbers to match the RT's own values
    data.rtNumber = rtResident.rtNumber;
    data.rwNumber = rtResident.rwNumber;
  }
  
  // Create resident
  const resident = await prisma.resident.create({
    data: {
      ...(data as any),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      family: true,
    },
  });
  
  // Create notifications for RT users
  await createResidentVerificationNotificationsForRT(resident);

  return resident;
};

// Update resident
export const updateResident = async (id: number, data: Partial<Resident>, currentUser: CurrentUser) => {
  // Check if user has permission to update this resident
  const canAccess = await canAccessResident(id, currentUser);
  
  if (!canAccess) {
    throw new ApiError('You do not have permission to update this resident', 403);
  }
  
  // Check if resident exists
  const existingResident = await prisma.resident.findUnique({
    where: { id },
  });
  
  if (!existingResident) {
    throw new ApiError('Resident not found', 404);
  }
  
  // Check if NIK is being changed and already exists
  if (data.nik && data.nik !== existingResident.nik) {
    const nikExists = await prisma.resident.findUnique({
      where: { nik: data.nik },
    });
    
    if (nikExists) {
      throw new ApiError('Resident with this NIK already exists', 400);
    }
  }
  
  // If RT is updating, ensure they can't change RT/RW numbers
  if (currentUser.role === 'RT') {
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!rtResident) {
      throw new ApiError('RT profile not found', 404);
    }
    
    // Ensure RT can't change RT/RW numbers
    data.rtNumber = existingResident.rtNumber;
    data.rwNumber = existingResident.rwNumber;
  }
  
  // Update resident
  const updatedResident = await prisma.resident.update({
    where: { id },
    data: {
      ...(data as any),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      family: true,
    },
  });
  
  return updatedResident;
};

// Delete resident
export const deleteResident = async (id: number, currentUser: CurrentUser) => {
  // Only RW and ADMIN can delete residents
  if (!hasPermission(currentUser.role, 'RW')) {
    throw new ApiError('You do not have permission to delete residents', 403);
  }
  
  // Check if resident exists
  const existingResident = await prisma.resident.findUnique({
    where: { id },
  });
  
  if (!existingResident) {
    throw new ApiError('Resident not found', 404);
  }
  
  // Delete resident
  await prisma.resident.delete({
    where: { id },
  });
  
  return true;
};

// Verify resident
export const verifyResident = async (id: number, currentUser: CurrentUser) => {
  // Check if resident exists
  const existingResident = await prisma.resident.findUnique({
    where: { id },
  });
  
  if (!existingResident) {
    throw new ApiError('Resident not found', 404);
  }
  
  // Check if verifier has permission (only RT, RW, or ADMIN can verify)
  if (!hasPermission(currentUser.role, 'RT')) {
    throw new ApiError('You do not have permission to verify residents', 403);
  }
  
  // If RT is verifying, ensure resident belongs to their RT
  if (currentUser.role === 'RT') {
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!rtResident) {
      throw new ApiError('RT profile not found', 404);
    }
    
    if (existingResident.rtNumber !== rtResident.rtNumber || 
        existingResident.rwNumber !== rtResident.rwNumber) {
      throw new ApiError('You can only verify residents in your RT', 403);
    }
  }
  
  // Get verifier name
  const verifier = await prisma.user.findUnique({
    where: { id: currentUser.id },
  });
  
  if (!verifier) {
    throw new ApiError('Verifier not found', 404);
  }
  
  // Update resident
  const verifiedResident = await prisma.resident.update({
    where: { id },
    data: {
      isVerified: true,
      verifiedBy: verifier.name,
      verifiedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      family: true,
    },
  });
  
  return verifiedResident;
};

// Import residents from CSV/Excel
export const importResidents = async (residents: Partial<Resident>[], currentUser: CurrentUser) => {
  // Only RT, RW, and ADMIN can import residents
  if (!hasPermission(currentUser.role, 'RT')) {
    throw new ApiError('You do not have permission to import residents', 403);
  }
  
  // If RT is importing, restrict to their RT
  if (currentUser.role === 'RT') {
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!rtResident) {
      throw new ApiError('RT profile not found', 404);
    }
    
    // Force all imported residents to have the RT's RT/RW numbers
    residents = residents.map(resident => ({
      ...resident,
      rtNumber: rtResident.rtNumber,
      rwNumber: rtResident.rwNumber,
    }));
  }
  
  // Process each resident
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };
  
  for (const residentData of residents) {
    try {
      // Check if NIK already exists
      if (residentData.nik) {
        const existingResident = await prisma.resident.findUnique({
          where: { nik: residentData.nik },
        });
        
        if (existingResident) {
          results.failed++;
          results.errors.push(`NIK ${residentData.nik} already exists`);
          continue;
        }
      }
      
      // Create resident
      await prisma.resident.create({
        data: {
          ...(residentData as any),
        },
      });
      
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Error creating resident: ${(error as Error).message}`);
    }
  }
  
  return results;
};

// Export residents to CSV
export const exportResidents = async (params: ExportQueryParams, currentUser: CurrentUser) => {
  const { search, rtNumber, rwNumber } = params;
  
  // Build where conditions
  const whereConditions: any = {};
  
  if (search) {
    whereConditions.OR = [
      { fullName: { contains: search } },
      { nik: { contains: search } },
      { noKK: { contains: search } },
    ];
  }
  
  // Apply role-based filtering
  if (currentUser.role === 'RT') {
    // RT can only export residents in their RT
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!rtResident) {
      throw new ApiError('RT profile not found', 404);
    }
    
    whereConditions.rtNumber = rtResident.rtNumber;
    whereConditions.rwNumber = rtResident.rwNumber;
  } else if (currentUser.role === 'WARGA') {
    // Warga can only export their own record and family members
    const wargaResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
      include: { family: true },
    });
    
    if (!wargaResident) {
      throw new ApiError('Resident profile not found', 404);
    }
    
    // If warga has family, they can export family members, otherwise just themselves
    if (wargaResident.familyId) {
      whereConditions.OR = [
        { id: wargaResident.id },
        { familyId: wargaResident.familyId },
      ];
    } else {
      whereConditions.id = wargaResident.id;
    }
  } else {
    // Admin and RW can export all residents
    // Apply optional filters if provided
    if (rtNumber) {
      whereConditions.rtNumber = rtNumber;
    }
    
    if (rwNumber) {
      whereConditions.rwNumber = rwNumber;
    }
  }
  
  // Get all residents without pagination for export
  const residents = await prisma.resident.findMany({
    where: whereConditions,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      family: true,
    },
    orderBy: {
      fullName: 'asc',
    },
  });
  
  return residents;
};

// Get resident statistics
export const getResidentStatistics = async (currentUser: CurrentUser) => {
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
    
    whereConditions.rtNumber = rtResident.rtNumber;
    whereConditions.rwNumber = rtResident.rwNumber;
  } else if (currentUser.role === 'WARGA') {
    // Warga can only see statistics for their family
    const wargaResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!wargaResident) {
      throw new ApiError('Resident profile not found', 404);
    }
    
    if (wargaResident.familyId) {
      whereConditions.familyId = wargaResident.familyId;
    } else {
      whereConditions.id = wargaResident.id;
    }
  }
  
  // Get total residents
  const totalResidents = await prisma.resident.count({
    where: whereConditions,
  });
  
  // Get gender distribution
  const maleCount = await prisma.resident.count({
    where: {
      ...whereConditions,
      gender: 'LAKI_LAKI',
    },
  });
  
  const femaleCount = await prisma.resident.count({
    where: {
      ...whereConditions,
      gender: 'PEREMPUAN',
    },
  });
  
  // Get age distribution
  const now = new Date();
  const ageRanges = [
    { min: 0, max: 5 },
    { min: 6, max: 17 },
    { min: 18, max: 30 },
    { min: 31, max: 45 },
    { min: 46, max: 60 },
    { min: 61, max: 200 },
  ];
  
  const ageDistribution = [];
  
  for (const range of ageRanges) {
    const minDate = new Date(now);
    minDate.setFullYear(now.getFullYear() - range.max - 1);
    minDate.setDate(minDate.getDate() + 1);
    
    const maxDate = new Date(now);
    maxDate.setFullYear(now.getFullYear() - range.min);
    
    const count = await prisma.resident.count({
      where: {
        ...whereConditions,
        birthDate: {
          gte: minDate,
          lte: maxDate,
        },
      },
    });
    
    ageDistribution.push({
      range: `${range.min}-${range.max === 200 ? '>' : range.max}`,
      count,
    });
  }
  
  // Get education distribution
  const educationDistribution = [];
  const educationLevels = ['TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'];
  
  for (const level of educationLevels) {
    const count = await prisma.resident.count({
      where: {
        ...whereConditions,
        education: level,
      },
    });
    
    educationDistribution.push({
      level,
      count,
    });
  }
  
  // Get verification status
  const verifiedCount = await prisma.resident.count({
    where: {
      ...whereConditions,
      isVerified: true,
    },
  });
  
  const unverifiedCount = totalResidents - verifiedCount;
  
  return {
    totalResidents,
    genderDistribution: {
      male: maleCount,
      female: femaleCount,
    },
    ageDistribution,
    educationDistribution,
    verificationStatus: {
      verified: verifiedCount,
      unverified: unverifiedCount,
    },
  };
};

// Helper function to check if a user can access a specific resident
async function canAccessResident(residentId: number, currentUser: CurrentUser): Promise<boolean> {
  // Admin and RW can access all residents
  if (hasPermission(currentUser.role, 'RW')) {
    return true;
  }
  
  const targetResident = await prisma.resident.findUnique({
    where: { id: residentId },
    include: { family: true },
  });
  
  if (!targetResident) {
    return false;
  }
  
  if (currentUser.role === 'RT') {
    // RT can access residents in their RT
    const rtResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!rtResident) {
      return false;
    }
    
    return targetResident.rtNumber === rtResident.rtNumber && 
           targetResident.rwNumber === rtResident.rwNumber;
  } else if (currentUser.role === 'WARGA') {
    // Warga can access their own record and family members
    const wargaResident = await prisma.resident.findFirst({
      where: { userId: currentUser.id },
    });
    
    if (!wargaResident) {
      return false;
    }
    
    // Own record
    if (wargaResident.id === targetResident.id) {
      return true;
    }
    
    // Family member
    return wargaResident.familyId !== null && 
           wargaResident.familyId === targetResident.familyId;
  }
  
  return false;
} 

// Helper function to create notifications for RT users when new residents need verification
async function createResidentVerificationNotificationsForRT(resident: Resident) {
  try {
    const { rtNumber, rwNumber } = resident;
    
    // Get all RT users for the resident's RT
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
          type: 'SYSTEM',
          title: 'Verifikasi Warga Baru',
          message: `Warga baru ${resident.fullName} memerlukan verifikasi Anda`,
          priority: 'HIGH',
          data: JSON.stringify({
            residentId: resident.id,
            residentName: resident.fullName,
            residentNik: resident.nik,
            residentAddress: resident.address,
          }),
        },
      });
    }
  } catch (error) {
    console.error('Error creating resident verification notifications for RT:', error);
  }
} 