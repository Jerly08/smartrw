import { PrismaClient, EventCategory } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

// Interface for event creation/update
interface EventInput {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  category: EventCategory;
  isPublished?: boolean;
  targetRTs?: string; // JSON string of RT numbers
}

// Get all events with filtering
export const getAllEvents = async (
  params: {
    page?: number;
    limit?: number;
  search?: string;
  category?: EventCategory;
  startDate?: Date;
  endDate?: Date;
    isPublished?: boolean;
  rtNumber?: string;
  } = {}
) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    category, 
    startDate, 
    endDate,
    isPublished,
    rtNumber
  } = params;
  
  const skip = (page - 1) * limit;
  
  // Build where conditions
  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { location: { contains: search } },
    ];
  }
  
  if (category) {
    where.category = category;
  }
  
  if (startDate) {
    where.startDate = { gte: startDate };
  }
  
  if (endDate) {
    where.endDate = { lte: endDate };
  }
  
  if (isPublished !== undefined) {
    where.isPublished = isPublished;
  }
  
  // Filter by RT if specified
    if (rtNumber) {
    where.targetRTs = { contains: rtNumber };
  }
  
  // Get total count for pagination
  const total = await prisma.event.count({ where });
  
  // Get events
  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: 'asc' },
    skip,
    take: limit,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      participants: {
        select: {
          id: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
      photos: true,
    },
      },
    },
  });
  
  return {
    events,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get event by ID
export const getEventById = async (id: number) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      participants: {
        select: {
          id: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      photos: true,
    },
  });
  
  if (!event) {
    throw new ApiError('Event not found', 404);
  }
  
  return event;
};

// Create new event
export const createEvent = async (data: EventInput, createdByUserId: number) => {
  // Create event
  const event = await prisma.event.create({
    data: {
      ...data,
      createdBy: createdByUserId,
    },
  });
  
  // Create notifications for the event if it's published
  await createEventNotifications(event, createdByUserId);
  
  return event;
};

// Update event
export const updateEvent = async (id: number, data: Partial<EventInput>, userId: number) => {
  // Check if event exists
  const existingEvent = await prisma.event.findUnique({
    where: { id },
  });
  
  if (!existingEvent) {
    throw new ApiError('Event not found', 404);
  }
  
  // Check if user is the creator or has permission
  if (existingEvent.createdBy !== userId) {
    throw new ApiError('You do not have permission to update this event', 403);
  }
  
  // Update event
  const updatedEvent = await prisma.event.update({
    where: { id },
    data,
  });
  
  // Create notifications for the event if it's published or if publish status changed
  if (data.isPublished !== undefined && data.isPublished !== existingEvent.isPublished) {
    await createEventNotifications(updatedEvent, userId);
  }
  
  return updatedEvent;
};

// Delete event
export const deleteEvent = async (id: number, userId: number) => {
  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id },
  });
  
  if (!event) {
    throw new ApiError('Event not found', 404);
  }
  
  // Check if user is the creator or has permission
  if (event.createdBy !== userId) {
    throw new ApiError('You do not have permission to delete this event', 403);
  }
  
  // Delete event
  await prisma.event.delete({
    where: { id },
  });
  
  return true;
};

// Publish event
export const publishEvent = async (id: number, userId: number) => {
  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id },
  });
  
  if (!event) {
    throw new ApiError('Event not found', 404);
  }
  
  // Check if user is the creator or has permission
  if (event.createdBy !== userId) {
    throw new ApiError('You do not have permission to publish this event', 403);
  }
  
  // Update event
  const updatedEvent = await prisma.event.update({
    where: { id },
    data: { isPublished: true },
  });
  
  // Create notifications for the event
  await createEventNotifications(updatedEvent, userId);
  
  return updatedEvent;
};

// Unpublish event
export const unpublishEvent = async (id: number, userId: number) => {
  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id },
  });
  
  if (!event) {
    throw new ApiError('Event not found', 404);
  }
  
  // Check if user is the creator or has permission
  if (event.createdBy !== userId) {
    throw new ApiError('You do not have permission to unpublish this event', 403);
  }
  
  // Update event
  const updatedEvent = await prisma.event.update({
    where: { id },
    data: { isPublished: false },
  });
  
  return updatedEvent;
};

// Create event notifications
export const createEventNotifications = async (
  event: { 
    id: number; 
    title: string; 
    category: any; // Changed from string to any to accept EventCategory
    startDate: Date; 
    endDate: Date; 
    location: string; 
    targetRTs?: string | null; 
    isPublished?: boolean;
    [key: string]: any; // Allow any other properties
  },
  createdByUserId: number
) => {
  try {
    // Parse targetRTs if it exists
    let targetRTNumbers: string[] = [];
    if (event.targetRTs) {
      try {
        targetRTNumbers = JSON.parse(event.targetRTs);
      } catch (e) {
        console.error('Error parsing targetRTs:', e);
      }
    }

    // If event is published, create notifications for users in the target RTs
    if (event.isPublished && targetRTNumbers.length > 0) {
      await notificationService.createNotificationForRT(
        targetRTNumbers,
        {
          type: 'EVENT',
          title: 'Kegiatan ' + event.category,
          message: `${event.title} akan dilaksanakan pada ${new Date(event.startDate).toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}`,
          priority: 'NORMAL',
          eventId: event.id,
    data: {
            eventTitle: event.title,
            eventDate: event.startDate,
            eventLocation: event.location,
          },
          // Set expiration to event end date
          expiresAt: event.endDate,
        }
      );
    }
  } catch (error) {
    console.error('Error creating event notifications:', error);
  }
}; 