import express from 'express';
import * as eventController from '../controllers/event.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { checkEventAccess, checkEventManageAccess } from '../middleware/event.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  createEventSchema, 
  updateEventSchema, 
  rsvpEventSchema, 
  uploadEventPhotoSchema,
  searchEventsSchema
} from '../schemas/event.schema';

const router = express.Router();

// Get all events
router.get(
  '/',
  authenticate,
  validateRequest(searchEventsSchema),
  eventController.getAllEvents
);

// Get event statistics
router.get(
  '/statistics',
  authenticate,
  eventController.getEventStatistics
);

// Get event by ID
router.get(
  '/:id',
  authenticate,
  checkEventAccess,
  eventController.getEventById
);

// Get event participants
router.get(
  '/:id/participants',
  authenticate,
  checkEventAccess,
  eventController.getEventParticipants
);

// Export event participants to CSV
router.get(
  '/:id/participants/export',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkEventManageAccess,
  eventController.exportEventParticipants
);

// Create event - only RT, RW, and Admin can create events
router.post(
  '/',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  validateRequest(createEventSchema),
  eventController.createEvent
);

// Update event - only event creator, RT (for their RT), RW, and Admin can update events
router.put(
  '/:id',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkEventManageAccess,
  validateRequest(updateEventSchema),
  eventController.updateEvent
);

// Delete event - only event creator, RT (for their RT), RW, and Admin can delete events
router.delete(
  '/:id',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkEventManageAccess,
  eventController.deleteEvent
);

// RSVP to event - all authenticated users can RSVP to events
router.post(
  '/:id/rsvp',
  authenticate,
  checkEventAccess,
  validateRequest(rsvpEventSchema),
  eventController.rsvpToEvent
);

// Update participant status - only event creator, RT (for their RT), RW, and Admin can update participant status
router.put(
  '/:id/participants/:userId',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkEventManageAccess,
  validateRequest(rsvpEventSchema),
  eventController.updateParticipantStatus
);

// Add photo to event - only event creator, RT (for their RT), RW, and Admin can add photos
router.post(
  '/:id/photos',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkEventManageAccess,
  validateRequest(uploadEventPhotoSchema),
  eventController.addEventPhoto
);

// Delete photo from event - only event creator, RT (for their RT), RW, and Admin can delete photos
router.delete(
  '/:id/photos/:photoId',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkEventManageAccess,
  eventController.deleteEventPhoto
);

// Publish event - only event creator, RT (for their RT), RW, and Admin can publish events
router.post(
  '/:id/publish',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkEventManageAccess,
  eventController.publishEvent
);

// Unpublish event - only event creator, RT (for their RT), RW, and Admin can unpublish events
router.post(
  '/:id/unpublish',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkEventManageAccess,
  eventController.unpublishEvent
);

export default router; 