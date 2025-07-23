import { PrismaClient, Family } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface FamilyQueryParams {
  page: number;
  limit: number;
  search?: string;
  rtNumber?: string;
  rwNumber?: string;
}

// Get all families with pagination and filtering
export const getAllFamilies = async (params: FamilyQueryParams) => {
  const { page, limit, search, rtNumber, rwNumber } = params;
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Build where conditions
  const whereConditions: any = {};
  
  if (search) {
    whereConditions.OR = [
      { noKK: { contains: search } },
      { address: { contains: search } },
    ];
  }
  
  if (rtNumber) {
    whereConditions.rtNumber = rtNumber;
  }
  
  if (rwNumber) {
    whereConditions.rwNumber = rwNumber;
  }
  
  // Get families with pagination
  const families = await prisma.family.findMany({
    where: whereConditions,
    include: {
      members: {
        select: {
          id: true,
          fullName: true,
          nik: true,
          gender: true,
          familyRole: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      noKK: 'asc',
    },
  });
  
  // Get total count for pagination
  const totalItems = await prisma.family.count({
    where: whereConditions,
  });
  
  return {
    families,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
};

// Get family by ID
export const getFamilyById = async (id: number) => {
  const family = await prisma.family.findUnique({
    where: { id },
    include: {
      members: true,
    },
  });
  
  if (!family) {
    throw new ApiError('Family not found', 404);
  }
  
  return family;
};

// Get family by KK number
export const getFamilyByKK = async (noKK: string) => {
  const family = await prisma.family.findUnique({
    where: { noKK },
    include: {
      members: true,
    },
  });
  
  if (!family) {
    throw new ApiError('Family not found', 404);
  }
  
  return family;
};

// Create family
export const createFamily = async (data: Partial<Family>) => {
  // Check if KK number already exists
  if (data.noKK) {
    const existingFamily = await prisma.family.findUnique({
      where: { noKK: data.noKK },
    });
    
    if (existingFamily) {
      throw new ApiError('Family with this KK number already exists', 400);
    }
  }
  
  // Create family
  const family = await prisma.family.create({
    data: {
      ...(data as any),
    },
    include: {
      members: true,
    },
  });
  
  return family;
};

// Update family
export const updateFamily = async (id: number, data: Partial<Family>) => {
  // Check if family exists
  const existingFamily = await prisma.family.findUnique({
    where: { id },
  });
  
  if (!existingFamily) {
    throw new ApiError('Family not found', 404);
  }
  
  // Check if KK number is being changed and already exists
  if (data.noKK && data.noKK !== existingFamily.noKK) {
    const kkExists = await prisma.family.findUnique({
      where: { noKK: data.noKK },
    });
    
    if (kkExists) {
      throw new ApiError('Family with this KK number already exists', 400);
    }
  }
  
  // Update family
  const updatedFamily = await prisma.family.update({
    where: { id },
    data: {
      ...(data as any),
    },
    include: {
      members: true,
    },
  });
  
  return updatedFamily;
};

// Delete family
export const deleteFamily = async (id: number) => {
  // Check if family exists
  const existingFamily = await prisma.family.findUnique({
    where: { id },
    include: {
      members: true,
    },
  });
  
  if (!existingFamily) {
    throw new ApiError('Family not found', 404);
  }
  
  // Check if family has members
  if (existingFamily.members.length > 0) {
    throw new ApiError('Cannot delete family with members. Remove members first.', 400);
  }
  
  // Delete family
  await prisma.family.delete({
    where: { id },
  });
  
  return true;
};

// Add member to family
export const addFamilyMember = async (familyId: number, residentId: number, familyRole: string) => {
  // Check if family exists
  const family = await prisma.family.findUnique({
    where: { id: familyId },
  });
  
  if (!family) {
    throw new ApiError('Family not found', 404);
  }
  
  // Check if resident exists
  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
  });
  
  if (!resident) {
    throw new ApiError('Resident not found', 404);
  }
  
  // Check if resident already belongs to a family
  if (resident.familyId) {
    throw new ApiError('Resident already belongs to a family', 400);
  }
  
  // Add resident to family
  const updatedResident = await prisma.resident.update({
    where: { id: residentId },
    data: {
      familyId,
      familyRole: familyRole as any,
      noKK: family.noKK, // Update resident's KK number to match family
    },
    include: {
      family: true,
    },
  });
  
  return updatedResident;
};

// Remove member from family
export const removeFamilyMember = async (familyId: number, residentId: number) => {
  // Check if family exists
  const family = await prisma.family.findUnique({
    where: { id: familyId },
  });
  
  if (!family) {
    throw new ApiError('Family not found', 404);
  }
  
  // Check if resident exists and belongs to the family
  const resident = await prisma.resident.findFirst({
    where: {
      id: residentId,
      familyId,
    },
  });
  
  if (!resident) {
    throw new ApiError('Resident not found in this family', 404);
  }
  
  // Remove resident from family
  const updatedResident = await prisma.resident.update({
    where: { id: residentId },
    data: {
      familyId: null,
      familyRole: null,
    },
  });
  
  return updatedResident;
}; 