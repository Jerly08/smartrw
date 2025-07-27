import { Request, Response, NextFunction } from 'express';
import * as rtService from '../services/rt.service';
import { ApiError } from '../middleware/error.middleware';
import { createRTSchema, updateRTSchema } from '../schemas/rt.schema';
import { ZodError } from 'zod';

// Get all RTs
export const getAllRTs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', search, includeInactive = 'false' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const result = await rtService.getAllRTs({
      page: pageNum,
      limit: limitNum,
      search: search as string,
      includeInactive: includeInactive === 'true',
    }, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      results: result.rts.length,
      totalPages: result.totalPages,
      currentPage: pageNum,
      totalItems: result.totalItems,
      data: {
        rts: result.rts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get RT by ID
export const getRTById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rtId = parseInt(req.params.id);
    
    if (isNaN(rtId)) {
      throw new ApiError('Invalid RT ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const rt = await rtService.getRTById(rtId, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        rt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get RT by number
export const getRTByNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { number } = req.params;
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const rt = await rtService.getRTByNumber(number, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        rt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create RT
export const createRT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate user
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    // Enhanced logging for debugging
    console.log('=== RT Creation Request ===');
    console.log('User:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    });
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Detailed debugging for the "number" field
    const rawNumber = req.body.number;
    console.log('=== Number Field Analysis ===');
    console.log('Raw number field:', JSON.stringify(rawNumber));
    console.log('Type of number field:', typeof rawNumber);
    console.log('Length of number field:', rawNumber ? rawNumber.length : 'N/A');
    console.log('Number field character codes:', rawNumber ? Array.from(rawNumber as string).map((char: string) => char.charCodeAt(0)) : 'N/A');
    console.log('Number field after trim:', rawNumber ? JSON.stringify(rawNumber.trim()) : 'N/A');
    
    // Normalize the number field if it exists
    if (rawNumber && typeof rawNumber === 'string') {
      req.body.number = rawNumber.trim();
      console.log('Normalized number field:', JSON.stringify(req.body.number));
    }
    
    // Validate request body against schema
    let validatedData;
    try {
      validatedData = createRTSchema.parse(req.body);
      console.log('Validation successful:', JSON.stringify(validatedData, null, 2));
    } catch (validationError) {
      console.error('=== Validation Error Details ===');
      console.error('Validation failed:', validationError);
      
      if (validationError instanceof ZodError) {
        console.error('Detailed Zod errors:');
        validationError.errors.forEach((err, index) => {
          console.error(`Error ${index + 1}:`, {
            path: err.path,
            message: err.message,
            code: err.code,
            received: 'received' in err ? err.received : 'N/A',
            expected: 'expected' in err ? err.expected : 'N/A'
          });
        });
        
        const errors = validationError.errors.map(err => {
          return `${err.path.join('.')}: ${err.message}`;
        });
        
        throw new ApiError(`Validation failed: ${errors.join(', ')}`, 400);
      }
      
      throw new ApiError('Invalid request data', 400);
    }
    
    const result = await rtService.createRT(validatedData, req.user);
    
    console.log('RT Creation successful:', {
      rtId: result.rt.id,
      rtNumber: result.rt.number,
      credentials: {
        email: result.credentials.email,
        hasPassword: !!result.credentials.password
      }
    });
    
    res.status(201).json({
      status: 'success',
      message: 'RT created successfully',
      data: result,
    });
  } catch (error) {
    console.error('=== RT Creation Error ===');
    console.error('User:', req.user ? {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    } : 'Not authenticated');
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Type-safe error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        statusCode: (error as any).statusCode || 500,
        stack: error.stack
      });
    } else {
      console.error('Unknown error:', error);
    }
    
    // Log Prisma-specific errors
    const prismaError = error as any;
    if (prismaError.code) {
      console.error('Prisma error code:', prismaError.code);
      console.error('Prisma error meta:', prismaError.meta);
    }
    
    // Log validation errors if they exist
    if (prismaError.errors && Array.isArray(prismaError.errors)) {
      console.error('Validation errors:', prismaError.errors);
    }
    
    next(error);
  }
};

// Update RT
export const updateRT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rtId = parseInt(req.params.id);
    
    if (isNaN(rtId)) {
      throw new ApiError('Invalid RT ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    console.log('=== RT Update Request ===');
    console.log('RT ID:', rtId);
    console.log('User:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    });
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate request body
    const validation = updateRTSchema.safeParse(req.body);
    
    if (!validation.success) {
      console.error('=== RT Update Validation Error ===');
      console.error('Validation errors:', validation.error.errors);
      console.error('Request body that failed validation:', JSON.stringify(req.body, null, 2));
      
      throw new ApiError(
        `Validation failed: ${validation.error.errors.map(err => 
          `${err.path.join('.')} - ${err.message}`
        ).join(', ')}`,
        400
      );
    }
    
    // Sanitize null values to undefined to match service interface
    const sanitizedData = Object.fromEntries(
      Object.entries(validation.data).map(([key, value]) => [
        key,
        value === null ? undefined : value
      ])
    );
    
    console.log('Validated RT data:', JSON.stringify(validation.data, null, 2));
    console.log('Sanitized RT data:', JSON.stringify(sanitizedData, null, 2));
    
    const updatedRT = await rtService.updateRT(rtId, sanitizedData, {
      id: req.user.id,
      role: req.user.role
    });
    
    console.log('RT updated successfully:', {
      rtId,
      updatedFields: Object.keys(sanitizedData),
      updatedBy: req.user.id
    });
    
    res.status(200).json({
      status: 'success',
      message: 'RT updated successfully',
      data: {
        rt: updatedRT,
      },
    });
  } catch (error) {
    console.error('=== RT Update Error ===');
    console.error('RT ID:', req.params.id);
    console.error('User:', req.user ? {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    } : 'Not authenticated');
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Type-safe error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        statusCode: (error as any).statusCode || 500,
        stack: error.stack
      });
    } else {
      console.error('Unknown error:', error);
    }
    
    // Log Prisma-specific errors
    const prismaError = error as any;
    if (prismaError.code) {
      console.error('Prisma error code:', prismaError.code);
      console.error('Prisma error meta:', prismaError.meta);
    }
    
    // Log validation errors if they exist
    if (prismaError.errors && Array.isArray(prismaError.errors)) {
      console.error('Validation errors:', prismaError.errors);
    }
    
    next(error);
  }
};

// Delete RT
export const deleteRT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rtId = parseInt(req.params.id);
    
    if (isNaN(rtId)) {
      throw new ApiError('Invalid RT ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    await rtService.deleteRT(rtId, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      message: 'RT deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get RT statistics
export const getRTStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rtId = parseInt(req.params.id);
    
    if (isNaN(rtId)) {
      throw new ApiError('Invalid RT ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const statistics = await rtService.getRTStatistics(rtId, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        statistics,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get residents in RT
export const getRTResidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rtId = parseInt(req.params.id);
    const { page = '1', limit = '10', search } = req.query;
    
    if (isNaN(rtId)) {
      throw new ApiError('Invalid RT ID', 400);
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const result = await rtService.getRTResidents(rtId, {
      page: pageNum,
      limit: limitNum,
      search: search as string,
    }, {
      id: req.user.id,
      role: req.user.role
    });
    
    res.status(200).json({
      status: 'success',
      results: result.residents.length,
      totalPages: result.totalPages,
      currentPage: pageNum,
      totalItems: result.totalItems,
      data: {
        residents: result.residents,
      },
    });
  } catch (error) {
    next(error);
  }
};
