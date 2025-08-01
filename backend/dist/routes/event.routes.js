"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventController = __importStar(require("../controllers/event.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const event_middleware_1 = require("../middleware/event.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const event_schema_1 = require("../schemas/event.schema");
const router = express_1.default.Router();
// Get all events
router.get('/', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(event_schema_1.searchEventsSchema), eventController.getAllEvents);
// Get event statistics
router.get('/statistics', auth_middleware_1.authenticate, eventController.getEventStatistics);
// Get event by ID
router.get('/:id', auth_middleware_1.authenticate, event_middleware_1.checkEventAccess, eventController.getEventById);
// Get event participants
router.get('/:id/participants', auth_middleware_1.authenticate, event_middleware_1.checkEventAccess, eventController.getEventParticipants);
// Export event participants to CSV
router.get('/:id/participants/export', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), event_middleware_1.checkEventManageAccess, eventController.exportEventParticipants);
// Create event - only RT, RW, and Admin can create events
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), (0, validation_middleware_1.validateRequest)(event_schema_1.createEventSchema), eventController.createEvent);
// Update event - only event creator, RT (for their RT), RW, and Admin can update events
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), event_middleware_1.checkEventManageAccess, (0, validation_middleware_1.validateRequest)(event_schema_1.updateEventSchema), eventController.updateEvent);
// Delete event - only event creator, RT (for their RT), RW, and Admin can delete events
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), event_middleware_1.checkEventManageAccess, eventController.deleteEvent);
// RSVP to event - all authenticated users can RSVP to events
router.post('/:id/rsvp', auth_middleware_1.authenticate, event_middleware_1.checkEventAccess, (0, validation_middleware_1.validateRequest)(event_schema_1.rsvpEventSchema), eventController.rsvpToEvent);
// Update participant status - only event creator, RT (for their RT), RW, and Admin can update participant status
router.put('/:id/participants/:userId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), event_middleware_1.checkEventManageAccess, (0, validation_middleware_1.validateRequest)(event_schema_1.rsvpEventSchema), eventController.updateParticipantStatus);
// Add photo to event - only event creator, RT (for their RT), RW, and Admin can add photos
router.post('/:id/photos', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), event_middleware_1.checkEventManageAccess, (0, validation_middleware_1.validateRequest)(event_schema_1.uploadEventPhotoSchema), eventController.addEventPhoto);
// Delete photo from event - only event creator, RT (for their RT), RW, and Admin can delete photos
router.delete('/:id/photos/:photoId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), event_middleware_1.checkEventManageAccess, eventController.deleteEventPhoto);
// Publish event - only event creator, RT (for their RT), RW, and Admin can publish events
router.post('/:id/publish', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), event_middleware_1.checkEventManageAccess, eventController.publishEvent);
// Unpublish event - only event creator, RT (for their RT), RW, and Admin can unpublish events
router.post('/:id/unpublish', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), event_middleware_1.checkEventManageAccess, eventController.unpublishEvent);
exports.default = router;
