import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/event.service';
import { ApiError } from '../middleware/error.middleware';
import { EventCategory, RSVPStatus } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all events
export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search, 
      category, 
      startDate, 
      endDate,
      isPublished,
      rtNumber,
      rwNumber
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;
    
    if (startDate && typeof startDate === 'string' && startDate.trim() !== '' && !isNaN(Date.parse(startDate))) {
      parsedStartDate = new Date(startDate);
    }
    
    if (endDate && typeof endDate === 'string' && endDate.trim() !== '' && !isNaN(Date.parse(endDate))) {
      parsedEndDate = new Date(endDate);
    }
    
    const result = await eventService.getAllEvents({
      page: pageNum,
      limit: limitNum,
      search: search && search !== '' ? search as string : undefined,
      category: category && category !== '' ? category as EventCategory : undefined,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      rtNumber: rtNumber && rtNumber !== '' ? rtNumber as string : undefined,
      isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined
    });
    
    res.status(200).json({
      status: 'success',
      results: result.events.length,
      currentPage: pageNum,
      data: {
        events: result.events,
        pagination: result.pagination
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get event by ID
export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      throw new ApiError('Invalid event ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const event = await eventService.getEventById(eventId);
    
    res.status(200).json({
      status: 'success',
      data: {
        event,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create event
export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Received createEvent body:", req.body); // DEBUG LOG
    console.log("Request headers:", req.headers); // DEBUG LOG
    console.log("Request content-type:", req.headers['content-type']); // DEBUG LOG
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const { title, description, location, startDate, endDate, category, isPublished, targetRTs } = req.body;
    
    // Validate required fields
    if (!title || !description || !location || !startDate || !category) {
      throw new ApiError('Missing required fields', 400);
    }
    
    // Convert date strings to Date objects
    const startDateTime = new Date(startDate);
    
    if (isNaN(startDateTime.getTime())) {
      throw new ApiError('Invalid start date format', 400);
    }
    
    let endDateTime: Date | undefined;
    if (endDate && endDate.trim() !== '') {
      endDateTime = new Date(endDate);
      if (isNaN(endDateTime.getTime())) {
        throw new ApiError('Invalid end date format', 400);
      }
      
      if (startDateTime >= endDateTime) {
        throw new ApiError('End date must be after start date', 400);
      }
    }
    
    // Process targetRTs - convert array to JSON string
let targetRTsJson = undefined;
    if (targetRTs && Array.isArray(targetRTs) && targetRTs.length > 0) {
      targetRTsJson = JSON.stringify(targetRTs);
    }
    
    const eventData = {
      title,
      description,
      location,
      startDate: startDateTime,
      endDate: endDateTime,
      category,
      isPublished: Boolean(isPublished),
      targetRTs: targetRTsJson,
    };
    
    const newEvent = await eventService.createEvent(eventData, req.user.id);
    
    res.status(201).json({
      status: 'success',
      message: 'Event created successfully',
      data: {
        event: newEvent,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update event
export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      throw new ApiError('Invalid event ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const { title, description, location, startDate, endDate, category, isPublished, targetRTs } = req.body;
    
    const eventData: any = {};
    
    // Only include provided fields in the update data
    if (title !== undefined) eventData.title = title;
    if (description !== undefined) eventData.description = description;
    if (location !== undefined) eventData.location = location;
    if (category !== undefined) eventData.category = category;
    if (isPublished !== undefined) eventData.isPublished = Boolean(isPublished);
    
    // Process dates if provided
    if (startDate !== undefined) {
      const startDateTime = new Date(startDate);
      if (isNaN(startDateTime.getTime())) {
        throw new ApiError('Invalid start date format', 400);
      }
      eventData.startDate = startDateTime;
    }
    
    if (endDate !== undefined) {
      if (endDate === '' || endDate === null) {
        eventData.endDate = null;
      } else {
        const endDateTime = new Date(endDate);
        if (isNaN(endDateTime.getTime())) {
          throw new ApiError('Invalid end date format', 400);
        }
        eventData.endDate = endDateTime;
      }
    }
    
    // Validate dates if both are provided
    if (eventData.startDate && eventData.endDate && eventData.startDate >= eventData.endDate) {
      throw new ApiError('End date must be after start date', 400);
    }
    
    // Process targetRTs if provided
if (targetRTs !== undefined) {
      if (targetRTs === null || targetRTs === '') {
        eventData.targetRTs = undefined;
      } else if (Array.isArray(targetRTs)) {
        eventData.targetRTs = targetRTs.length > 0 ? JSON.stringify(targetRTs) : undefined;
      } else if (typeof targetRTs === 'string') {
        eventData.targetRTs = targetRTs;
      }
    }
    
    const updatedEvent = await eventService.updateEvent(eventId, eventData, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Event updated successfully',
      data: {
        event: updatedEvent,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      throw new ApiError('Invalid event ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    await eventService.deleteEvent(eventId, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// RSVP to event
export const rsvpToEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      throw new ApiError('Invalid event ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const { status } = req.body;
    
    if (!status || !Object.values(RSVPStatus).includes(status)) {
      throw new ApiError('Invalid RSVP status', 400);
    }
    
    // Since rsvpToEvent doesn't exist in the service, we'll implement it directly here
    // First check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      throw new ApiError('Event not found', 404);
    }
    
    // Check if user has already RSVP'd
    const existingRSVP = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: req.user.id,
        },
      },
    });
    
    let rsvp;
    
    if (existingRSVP) {
      // Update existing RSVP
      rsvp = await prisma.eventParticipant.update({
        where: {
          id: existingRSVP.id,
        },
        data: {
          status,
        },
      });
    } else {
      // Create new RSVP
      rsvp = await prisma.eventParticipant.create({
        data: {
          eventId,
          userId: req.user.id,
          status,
        },
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'RSVP updated successfully',
      data: {
        rsvp,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get event participants
export const getEventParticipants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      throw new ApiError('Invalid event ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Since getEventParticipants doesn't exist in the service, we'll implement it directly here
    // First check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      throw new ApiError('Event not found', 404);
    }
    
    // Get participants
    const participants = await prisma.eventParticipant.findMany({
      where: {
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            resident: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        participants,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update participant status
export const updateParticipantStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    if (isNaN(eventId) || isNaN(userId)) {
      throw new ApiError('Invalid ID parameters', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const { status } = req.body;
    
    if (!status || !Object.values(RSVPStatus).includes(status)) {
      throw new ApiError('Invalid participant status', 400);
    }
    
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      throw new ApiError('Event not found', 404);
    }
    
    // Check if user is authorized to update participant status
    if (event.createdBy !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
      throw new ApiError('You are not authorized to update participant status', 403);
    }
    
    // Check if participant exists
    const participant = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
    
    if (!participant) {
      throw new ApiError('Participant not found', 404);
    }
    
    // Update participant status
    const updatedParticipant = await prisma.eventParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Participant status updated successfully',
      data: {
        participant: updatedParticipant,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add event photo
export const addEventPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      throw new ApiError('Invalid event ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      throw new ApiError('Event not found', 404);
    }
    
    // Check if user is authorized to add photos
    if (event.createdBy !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
      throw new ApiError('You are not authorized to add photos to this event', 403);
    }
    
    // Process uploaded files
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new ApiError('No photos uploaded', 400);
    }
    
    const uploadDir = path.join(__dirname, '../../uploads/events');
    
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Process each photo
    const photos = [];
    
    for (const file of req.files) {
      // Generate unique filename
      const fileName = `${uuidv4()}-${file.originalname}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Write file to disk
      await fs.promises.writeFile(filePath, file.buffer);
      
      // Create photo record in database
      const photo = await prisma.eventPhoto.create({
        data: {
          eventId,
          photoUrl: `/uploads/events/${fileName}`,
          caption: null, // Set caption to null since we don't have it from the file
        },
      });
      
      photos.push(photo);
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Photos uploaded successfully',
      data: {
        photos,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete event photo
export const deleteEventPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    const photoId = parseInt(req.params.photoId);
    
    if (isNaN(eventId) || isNaN(photoId)) {
      throw new ApiError('Invalid ID parameters', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      throw new ApiError('Event not found', 404);
    }
    
    // Check if user is authorized to delete photos
    if (event.createdBy !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
      throw new ApiError('You are not authorized to delete photos from this event', 403);
    }
    
    // Check if photo exists and belongs to the event
    const photo = await prisma.eventPhoto.findFirst({
      where: {
        id: photoId,
        eventId,
      },
    });
    
    if (!photo) {
      throw new ApiError('Photo not found', 404);
    }
    
    // Delete photo file from disk if it exists
    if (photo.photoUrl) {
      const filePath = path.join(__dirname, '../../', photo.photoUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete photo from database
    await prisma.eventPhoto.delete({
      where: {
        id: photoId,
      },
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Publish event
export const publishEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      throw new ApiError('Invalid event ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const event = await eventService.publishEvent(eventId, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Event published successfully',
      data: {
        event,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Unpublish event
export const unpublishEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      throw new ApiError('Invalid event ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const event = await eventService.unpublishEvent(eventId, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Event unpublished successfully',
      data: {
        event,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get event statistics
export const getEventStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get statistics directly from the database
    const total = await prisma.event.count();
    const upcoming = await prisma.event.count({
      where: {
        startDate: {
          gte: new Date(),
        },
      },
    });
    const past = await prisma.event.count({
      where: {
        endDate: {
          lt: new Date(),
        },
      },
    });
    const published = await prisma.event.count({
      where: {
        isPublished: true,
      },
    });
    const unpublished = await prisma.event.count({
      where: {
        isPublished: false,
      },
    });
    
    const statistics = {
      total,
      upcoming,
      past,
      published,
      unpublished,
    };
    
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

// Export event participants to CSV
export const exportEventParticipants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      throw new ApiError('Invalid event ID', 400);
    }
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        startDate: true,
        location: true,
      },
    });
    
    if (!event) {
      throw new ApiError('Event not found', 404);
    }
    
    // Get participants with user details
    const participants = await prisma.eventParticipant.findMany({
      where: {
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            resident: {
              select: {
                fullName: true,
                phoneNumber: true,
                address: true,
                rtNumber: true,
                rwNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    // Create CSV content
    const csvHeader = [
      'No',
      'Nama',
      'Email',
      'No. Telepon',
      'Alamat',
      'RT',
      'RW',
      'Status RSVP',
      'Tanggal Daftar',
    ].join(',');
    
    const csvRows = participants.map((participant, index) => {
      const user = participant.user;
      const resident = user?.resident;
      
      return [
        index + 1,
        `"${user?.name || resident?.fullName || 'N/A'}"`,
        `"${user?.email || 'N/A'}"`,
        `"${resident?.phoneNumber || 'N/A'}"`,
        `"${resident?.address || 'N/A'}"`,
        `"${resident?.rtNumber || 'N/A'}"`,
        `"${resident?.rwNumber || 'N/A'}"`,
        `"${participant.status}"`,
        `"${participant.createdAt.toLocaleDateString('id-ID')}"`,
      ].join(',');
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Set headers for file download
    const fileName = `peserta-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Add BOM for proper UTF-8 encoding in Excel
    res.write('\uFEFF');
    res.end(csvContent);
  } catch (error) {
    next(error);
  }
};
