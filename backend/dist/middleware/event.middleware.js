"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEventManageAccess = exports.checkEventAccess = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("../utils/helpers");
const prisma = new client_1.PrismaClient();
// Middleware to check if user can access a specific event
const checkEventAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }
        // Admin and RW have full access to all events
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // Get the event
        const event = yield prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        // Creator can always access their own events
        if (event.createdBy === req.user.id) {
            return next();
        }
        // Warga can only access published events
        if (req.user.role === 'WARGA' && !event.isPublished) {
            return res.status(403).json({ message: 'You can only access published events' });
        }
        // Check if event targets specific RTs
        if (event.targetRTs) {
            const targetRTs = (0, helpers_1.safeJsonParse)(event.targetRTs, []);
            if (targetRTs.length > 0) {
                // Get user's RT
                const userResident = yield prisma.resident.findFirst({
                    where: { userId: req.user.id },
                });
                if (!userResident) {
                    return res.status(403).json({ message: 'Resident profile not found' });
                }
                // Check if user's RT is in the target RTs
                if (!targetRTs.includes(userResident.rtNumber)) {
                    return res.status(403).json({ message: 'This event is not for your RT' });
                }
            }
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking event access' });
    }
});
exports.checkEventAccess = checkEventAccess;
// Middleware to check if user can manage a specific event
const checkEventManageAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }
        // Admin and RW have full access to all events
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // Get the event
        const event = yield prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        // Creator can always manage their own events
        if (event.createdBy === req.user.id) {
            return next();
        }
        // RT can manage events for their RT
        if (req.user.role === 'RT') {
            // Check if event targets specific RTs
            if (event.targetRTs) {
                const targetRTs = (0, helpers_1.safeJsonParse)(event.targetRTs, []);
                if (targetRTs.length > 0) {
                    // Get RT's RT number
                    const rtResident = yield prisma.resident.findFirst({
                        where: { userId: req.user.id },
                    });
                    if (!rtResident) {
                        return res.status(403).json({ message: 'RT profile not found' });
                    }
                    // Check if RT's RT number is in the target RTs
                    if (targetRTs.includes(rtResident.rtNumber)) {
                        return next();
                    }
                }
            }
        }
        return res.status(403).json({ message: 'You do not have permission to manage this event' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking event manage access' });
    }
});
exports.checkEventManageAccess = checkEventManageAccess;
