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
  endDate?: Date;
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
    endDate?: Date | null; 
    location: string; 
    targetRTs?: string | null; 
    isPublished?: boolean;
    [key: string]: any; // Allow any other properties
  },
  createdByUserId: number
) => {
  try {
    // Get the creator's role to determine notification scope
    const creator = await prisma.user.findUnique({
      where: { id: createdByUserId },
      select: { role: true, resident: true },
    });

    if (!creator) {
      console.error('Creator not found for event notification');
      return;
    }

    // Parse targetRTs if it exists
    let targetRTNumbers: string[] = [];
    if (event.targetRTs) {
      try {
        targetRTNumbers = JSON.parse(event.targetRTs);
      } catch (e) {
        console.error('Error parsing targetRTs:', e);
      }
    }

    // If event is published, create notifications
    if (event.isPublished) {
      // For events created by ADMIN or RW, notify all users (including unverified warga)
      if (creator.role === 'ADMIN' || creator.role === 'RW') {
        // Get all users except the creator
        const allUsers = await prisma.user.findMany({
          where: {
            id: { not: createdByUserId },
            // Include all users regardless of verification status
          },
          select: { id: true },
        });

        const userIds = allUsers.map(user => user.id);
        
        await notificationService.createNotificationForUsers(
          userIds,
          {
            type: 'EVENT',
            title: `Kegiatan ${event.category}`,
            message: `${event.title} akan dilaksanakan pada ${new Date(event.startDate).toLocaleDateString('id-ID', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })} di ${event.location}`,
            priority: 'HIGH', // High priority for RW/Admin events
            eventId: event.id,
            data: {
              eventTitle: event.title,
              eventDate: event.startDate,
              eventLocation: event.location,
              creatorRole: creator.role,
            },
            // Set expiration to event end date + 1 day, or 7 days from start if no end date
            expiresAt: event.endDate 
              ? new Date(event.endDate.getTime() + 24 * 60 * 60 * 1000)
              : new Date(event.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          }
        );
      }
      // For events created by RT, notify users in specific RTs (including unverified)
      else if (creator.role === 'RT' && targetRTNumbers.length > 0) {
        // Get all users in the target RTs (including unverified)
        const residents = await prisma.resident.findMany({
          where: {
            rtNumber: {
              in: targetRTNumbers,
            },
            // Include both verified and unverified residents
          },
          select: {
            userId: true,
          },
        });

        // Also include users who registered but don't have resident profile yet
        const unregisteredUsers = await prisma.user.findMany({
          where: {
            id: { not: createdByUserId },
            resident: null, // Users without resident profile
            role: 'WARGA',
          },
          select: { id: true },
        });

        const userIds = [...residents.map(r => r.userId), ...unregisteredUsers.map(u => u.id)];
        
        if (userIds.length > 0) {
          await notificationService.createNotificationForUsers(
            userIds,
            {
              type: 'EVENT',
              title: `Kegiatan RT ${targetRTNumbers.join(', ')}`,
              message: `${event.title} akan dilaksanakan pada ${new Date(event.startDate).toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })} di ${event.location}`,
              priority: 'NORMAL',
              eventId: event.id,
              data: {
                eventTitle: event.title,
                eventDate: event.startDate,
                eventLocation: event.location,
                creatorRole: creator.role,
                targetRTs: targetRTNumbers,
              },
              // Set expiration to event end date, or 7 days from start if no end date
              expiresAt: event.endDate || new Date(event.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            }
          );
        }
      }
    }
  } catch (error) {
    console.error('Error creating event notifications:', error);
  }
};
