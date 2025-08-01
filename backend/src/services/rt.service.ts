import { PrismaClient } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface RTFilters {
  page: number;
  limit: number;
  search?: string;
  includeInactive?: boolean;
}

interface ResidentFilters {
  page: number;
  limit: number;
  search?: string;
}

interface UserContext {
  id: number;
  role: string;
}

interface CreateRTData {
  number: string;
  name?: string;
  description?: string;
  address?: string;
  chairperson?: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
}

interface UpdateRTData {
  number?: string;
  name?: string;
  description?: string;
  address?: string;
  chairperson?: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
}

// Get all RTs
export const getAllRTs = async (filters: RTFilters, userContext: UserContext) => {
  const { page, limit, search, includeInactive } = filters;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  if (!includeInactive) {
    where.isActive = true;
  }

  // Filter RTs by RW context for RW users
  if (userContext.role === 'RW') {
    // Get RW number from logged-in RW user's resident profile
    const rwUserResident = await prisma.resident.findFirst({
      where: { userId: userContext.id },
    });
    
    if (rwUserResident && rwUserResident.rwNumber) {
      // Filter residents by RW number and get their RT IDs
      const rtIds = await prisma.resident.findMany({
        where: { rwNumber: rwUserResident.rwNumber },
        select: { rtId: true },
        distinct: ['rtId'],
      });
      
      const rtIdArray = rtIds.map(r => r.rtId).filter(id => id !== null);
      
      if (rtIdArray.length > 0) {
        where.id = { in: rtIdArray };
      } else {
        // No RTs found for this RW, return empty result
        return {
          rts: [],
          totalItems: 0,
          totalPages: 0,
        };
      }
    } else {
      throw new ApiError('RW user profile not found. Please ensure the RW user has a valid resident profile.', 400);
    }
  }

  if (search) {
    where.OR = [
      { number: { contains: search } },
      { name: { contains: search } },
      { chairperson: { contains: search } },
      { address: { contains: search } },
    ];
  }

  // Get total count
  const totalItems = await prisma.rT.count({ where });
  const totalPages = Math.ceil(totalItems / limit);

  // Get RTs with resident count
  const rts = await prisma.rT.findMany({
    where,
    skip,
    take: limit,
    include: {
      _count: {
        select: {
          residents: true,
          families: true,
        },
      },
    },
    orderBy: {
      number: 'asc',
    },
  });

  return {
    rts,
    totalItems,
    totalPages,
  };
};

// Get RT by ID
export const getRTById = async (rtId: number, userContext: UserContext) => {
  const rt = await prisma.rT.findUnique({
    where: { id: rtId },
    include: {
      _count: {
        select: {
          residents: true,
          families: true,
        },
      },
    },
  });

  if (!rt) {
    throw new ApiError('RT not found', 404);
  }

  return rt;
};

// Get RT by number
export const getRTByNumber = async (number: string, userContext: UserContext) => {
  const rt = await prisma.rT.findUnique({
    where: { number },
    include: {
      _count: {
        select: {
          residents: true,
          families: true,
        },
      },
    },
  });

  if (!rt) {
    throw new ApiError('RT not found', 404);
  }

  return rt;
};

// Create RT
export const createRT = async (rtData: CreateRTData, userContext: UserContext) => {
  // Check if user has permission
  if (!['RW', 'ADMIN'].includes(userContext.role)) {
    throw new ApiError('Insufficient permissions', 403);
  }

  // Get RW number from logged-in RW user's resident profile
  let rwNumber = '001'; // Default fallback
  
  if (userContext.role === 'RW') {
    const rwUserResident = await prisma.resident.findFirst({
      where: { userId: userContext.id },
    });
    
    if (rwUserResident && rwUserResident.rwNumber) {
      rwNumber = rwUserResident.rwNumber;
    } else {
      throw new ApiError('RW user profile not found. Please ensure the RW user has a valid resident profile.', 400);
    }
  }

  // Check if RT number already exists
  const existingRT = await prisma.rT.findUnique({
    where: { number: rtData.number },
  });

  if (existingRT) {
    throw new ApiError('RT with this number already exists', 400);
  }

  // Generate RT user account credentials
  const rtEmail = rtData.email || `rt${rtData.number}@smartrw.local`;
  const rtPassword = `RT${rtData.number}@2024`; // Default password
  const hashedPassword = await bcrypt.hash(rtPassword, 12);
  
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: rtEmail },
  });
  
  if (existingUser) {
    throw new ApiError('Email already exists. Please use a different email for RT account.', 400);
  }

  // Use transaction to create RT, User, and Resident profile
  const result = await prisma.$transaction(async (tx) => {
    // Create RT user account
    const rtUser = await tx.user.create({
      data: {
        email: rtEmail,
        password: hashedPassword,
        name: rtData.chairperson || `Ketua RT ${rtData.number}`,
        role: 'RT',
      },
    });

    // Create RT with user relation
    const newRT = await tx.rT.create({
      data: {
        number: rtData.number,
        name: rtData.name,
        description: rtData.description,
        address: rtData.address,
        chairperson: rtData.chairperson,
        phoneNumber: rtData.phoneNumber,
        email: rtData.email,
        isActive: rtData.isActive ?? true,
        userId: rtUser.id,
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
        _count: {
          select: {
            residents: true,
            families: true,
          },
        },
      },
    });

    // Create a resident profile for the RT user
    // This is needed for the resident service to identify which RT area this user manages
    await tx.resident.create({
      data: {
        nik: `RT${rtData.number}${Date.now()}`, // Generate unique NIK for RT user
        noKK: `RT${rtData.number}${Date.now()}`, // Generate unique KK for RT user
        fullName: rtData.chairperson || `Ketua RT ${rtData.number}`,
        gender: 'LAKI_LAKI', // Default gender
        birthPlace: 'Indonesia',
        birthDate: new Date('1980-01-01'), // Default birth date
        address: rtData.address || `Wilayah RT ${rtData.number}`,
        rtNumber: rtData.number,
rwNumber: rwNumber, // Use RW number from logged-in user's context
        religion: 'ISLAM', // Default religion
        maritalStatus: 'KAWIN', // Default marital status
        occupation: 'Ketua RT',
        phoneNumber: rtData.phoneNumber,
        email: rtData.email,
        isVerified: true, // RT users are automatically verified
        verifiedBy: 'SYSTEM',
        verifiedAt: new Date(),
        domicileStatus: 'TETAP',
        userId: rtUser.id,
        rtId: newRT.id,
        familyRole: 'KEPALA_KELUARGA',
      },
    });

    return { rt: newRT, credentials: { email: rtEmail, password: rtPassword } };
  });

  return result;
};

// Update RT
export const updateRT = async (rtId: number, rtData: UpdateRTData, userContext: UserContext) => {
  // Check if user has permission
  if (!['RW', 'ADMIN'].includes(userContext.role)) {
    throw new ApiError('Insufficient permissions', 403);
  }

  // Check if RT exists
  const existingRT = await prisma.rT.findUnique({
    where: { id: rtId },
  });

  if (!existingRT) {
    throw new ApiError('RT not found', 404);
  }

  // Check if RT number already exists (if changing number)
  if (rtData.number && rtData.number !== existingRT.number) {
    const duplicateRT = await prisma.rT.findUnique({
      where: { number: rtData.number },
    });

    if (duplicateRT) {
      throw new ApiError('RT with this number already exists', 400);
    }
  }

  const updatedRT = await prisma.rT.update({
    where: { id: rtId },
    data: {
      ...(rtData.number && { number: rtData.number }),
      ...(rtData.name !== undefined && { name: rtData.name }),
      ...(rtData.description !== undefined && { description: rtData.description }),
      ...(rtData.address !== undefined && { address: rtData.address }),
      ...(rtData.chairperson !== undefined && { chairperson: rtData.chairperson }),
      ...(rtData.phoneNumber !== undefined && { phoneNumber: rtData.phoneNumber }),
      ...(rtData.email !== undefined && { email: rtData.email }),
      ...(rtData.isActive !== undefined && { isActive: rtData.isActive }),
    },
    include: {
      _count: {
        select: {
          residents: true,
          families: true,
        },
      },
    },
  });

  return updatedRT;
};

// Delete RT (soft delete by setting isActive to false)
export const deleteRT = async (rtId: number, userContext: UserContext) => {
  // Check if user has permission
  if (!['RW', 'ADMIN'].includes(userContext.role)) {
    throw new ApiError('Insufficient permissions', 403);
  }

  // Check if RT exists
  const existingRT = await prisma.rT.findUnique({
    where: { id: rtId },
    include: {
      _count: {
        select: {
          residents: true,
          families: true,
        },
      },
    },
  });

  if (!existingRT) {
    throw new ApiError('RT not found', 404);
  }

  // Check if RT has residents
  if (existingRT._count.residents > 0) {
    throw new ApiError('Cannot delete RT that has residents. Please move residents to another RT first.', 400);
  }

  // Soft delete by setting isActive to false
  await prisma.rT.update({
    where: { id: rtId },
    data: { isActive: false },
  });
};

// Get RT statistics
export const getRTStatistics = async (rtId: number, userContext: UserContext) => {
  const rt = await prisma.rT.findUnique({
    where: { id: rtId },
  });

  if (!rt) {
    throw new ApiError('RT not found', 404);
  }

  // Get resident statistics
  const totalResidents = await prisma.resident.count({
    where: { rtId },
  });

  const verifiedResidents = await prisma.resident.count({
    where: { 
      rtId,
      isVerified: true,
    },
  });

  const totalFamilies = await prisma.family.count({
    where: { rtId },
  });

  // Gender statistics
  const maleResidents = await prisma.resident.count({
    where: { 
      rtId,
      gender: 'LAKI_LAKI',
    },
  });

  const femaleResidents = await prisma.resident.count({
    where: { 
      rtId,
      gender: 'PEREMPUAN',
    },
  });

  // Age group statistics
  const now = new Date();
  const childrenCount = await prisma.resident.count({
    where: {
      rtId,
      birthDate: {
        gte: new Date(now.getFullYear() - 17, now.getMonth(), now.getDate()),
      },
    },
  });

  const adultCount = await prisma.resident.count({
    where: {
      rtId,
      birthDate: {
        lt: new Date(now.getFullYear() - 17, now.getMonth(), now.getDate()),
        gte: new Date(now.getFullYear() - 60, now.getMonth(), now.getDate()),
      },
    },
  });

  const elderlyCount = await prisma.resident.count({
    where: {
      rtId,
      birthDate: {
        lt: new Date(now.getFullYear() - 60, now.getMonth(), now.getDate()),
      },
    },
  });

  return {
    rt,
    totalResidents,
    verifiedResidents,
    unverifiedResidents: totalResidents - verifiedResidents,
    totalFamilies,
    genderDistribution: {
      male: maleResidents,
      female: femaleResidents,
    },
    ageDistribution: {
      children: childrenCount,
      adults: adultCount,
      elderly: elderlyCount,
    },
  };
};

// Get residents in RT
export const getRTResidents = async (rtId: number, filters: ResidentFilters, userContext: UserContext) => {
  const { page, limit, search } = filters;
  const skip = (page - 1) * limit;

  // Check if RT exists
  const rt = await prisma.rT.findUnique({
    where: { id: rtId },
  });

  if (!rt) {
    throw new ApiError('RT not found', 404);
  }

  // Build where clause
  const where: any = { rtId };

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { nik: { contains: search } },
      { noKK: { contains: search } },
    ];
  }

  // Get total count
  const totalItems = await prisma.resident.count({ where });
  const totalPages = Math.ceil(totalItems / limit);

  // Get residents
  const residents = await prisma.resident.findMany({
    where,
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      family: {
        select: {
          id: true,
          noKK: true,
        },
      },
    },
    orderBy: {
      fullName: 'asc',
    },
  });

  return {
    residents,
    totalItems,
    totalPages,
  };
};
