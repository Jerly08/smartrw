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
exports.checkComplaintRespondAccess = exports.checkComplaintUpdateAccess = exports.checkComplaintAccess = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Middleware to check if user can access a specific complaint
const checkComplaintAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const complaintId = parseInt(req.params.id);
        if (isNaN(complaintId)) {
            return res.status(400).json({ message: 'Invalid complaint ID' });
        }
        // Admin and RW have full access to all complaints
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // Get the complaint
        const complaint = yield prisma.complaint.findUnique({
            where: { id: complaintId },
            include: {
                creator: {
                    include: {
                        resident: true,
                    },
                },
            },
        });
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        // Creator can always access their own complaints
        if (complaint.createdBy === req.user.id) {
            return next();
        }
        // RT can access complaints from their RT
        if (req.user.role === 'RT') {
            // Get RT's RT and RW numbers
            const rtResident = yield prisma.resident.findFirst({
                where: { userId: req.user.id },
            });
            if (!rtResident) {
                return res.status(403).json({ message: 'RT profile not found' });
            }
            // Check if complaint creator is from RT's area
            if (((_b = (_a = complaint.creator) === null || _a === void 0 ? void 0 : _a.resident) === null || _b === void 0 ? void 0 : _b.rtNumber) === rtResident.rtNumber &&
                ((_d = (_c = complaint.creator) === null || _c === void 0 ? void 0 : _c.resident) === null || _d === void 0 ? void 0 : _d.rwNumber) === rtResident.rwNumber) {
                return next();
            }
        }
        return res.status(403).json({ message: 'You do not have permission to access this complaint' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking complaint access' });
    }
});
exports.checkComplaintAccess = checkComplaintAccess;
// Middleware to check if user can update a specific complaint
const checkComplaintUpdateAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const complaintId = parseInt(req.params.id);
        if (isNaN(complaintId)) {
            return res.status(400).json({ message: 'Invalid complaint ID' });
        }
        // Admin and RW have full access to all complaints
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // Get the complaint
        const complaint = yield prisma.complaint.findUnique({
            where: { id: complaintId },
        });
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        // Creator can update their own complaints
        if (complaint.createdBy === req.user.id) {
            // Warga can only update their own complaints if they are still in DITERIMA status
            if (req.user.role === 'WARGA' && complaint.status !== 'DITERIMA') {
                return res.status(403).json({ message: 'You cannot update a complaint that is already being processed' });
            }
            return next();
        }
        // RT can update complaints from their RT
        if (req.user.role === 'RT') {
            // Check if complaint creator is from RT's area
            yield (0, exports.checkComplaintAccess)(req, res, next);
            return;
        }
        return res.status(403).json({ message: 'You do not have permission to update this complaint' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking complaint update access' });
    }
});
exports.checkComplaintUpdateAccess = checkComplaintUpdateAccess;
// Middleware to check if user can respond to a specific complaint
const checkComplaintRespondAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Only Admin, RW, and RT can respond to complaints
        if (req.user.role === 'WARGA') {
            return res.status(403).json({ message: 'Only administrators can respond to complaints' });
        }
        const complaintId = parseInt(req.params.id);
        if (isNaN(complaintId)) {
            return res.status(400).json({ message: 'Invalid complaint ID' });
        }
        // Admin and RW have full access to all complaints
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // RT can respond to complaints from their RT
        if (req.user.role === 'RT') {
            // Check if complaint creator is from RT's area
            yield (0, exports.checkComplaintAccess)(req, res, next);
            return;
        }
        return res.status(403).json({ message: 'You do not have permission to respond to this complaint' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking complaint respond access' });
    }
});
exports.checkComplaintRespondAccess = checkComplaintRespondAccess;
