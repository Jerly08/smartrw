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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkResidentAccess = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Verify JWT token middleware
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required. No token provided.' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication required. Invalid token format.' });
        }
        const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
        // Use a simpler approach for JWT verification
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Check if user exists
        const user = yield prisma.user.findUnique({
            where: { id: decoded.id },
        });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        // Add user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: user.name // Include the user's name from the database
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
});
exports.authenticate = authenticate;
// Role-based authorization middleware
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'You do not have permission to access this resource' });
        }
        next();
    };
};
exports.authorize = authorize;
// Resident-specific access control middleware
const checkResidentAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const residentId = parseInt(req.params.id);
        if (isNaN(residentId)) {
            return res.status(400).json({ message: 'Invalid resident ID' });
        }
        // Admin and RW have full access to all residents
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // Get the target resident
        const targetResident = yield prisma.resident.findUnique({
            where: { id: residentId },
        });
        if (!targetResident) {
            return res.status(404).json({ message: 'Resident not found' });
        }
        if (req.user.role === 'RT') {
            // RT can access residents in their RT area or residents who registered under their RT
            const rtUser = yield prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    resident: true
                }
            });
            if (!rtUser || !rtUser.resident) {
                return res.status(403).json({ message: 'RT profile not found' });
            }
            // Check if the target resident is in their RT area OR if the resident selected this RT during registration
            const isInRTArea = targetResident.rtNumber === rtUser.resident.rtNumber &&
                targetResident.rwNumber === rtUser.resident.rwNumber;
            // Also check if this resident was registered/verified by this RT user
            const isRegisteredByRT = yield prisma.resident.findFirst({
                where: {
                    id: residentId,
                    OR: [
                        {
                            // Direct RT area match
                            rtNumber: rtUser.resident.rtNumber,
                            rwNumber: rtUser.resident.rwNumber
                        },
                        {
                            // Or resident chose this RT during verification
                            rt: {
                                number: rtUser.resident.rtNumber.toString()
                            }
                        }
                    ]
                },
                include: {
                    rt: true
                }
            });
            if (!isInRTArea && !isRegisteredByRT) {
                return res.status(403).json({ message: 'You can only access residents in your RT area or those registered under your RT' });
            }
        }
        else if (req.user.role === 'WARGA') {
            // Warga can only access their own record and family members
            const wargaResident = yield prisma.resident.findFirst({
                where: { userId: req.user.id },
            });
            if (!wargaResident) {
                return res.status(403).json({ message: 'Resident profile not found' });
            }
            // Check if it's their own record
            if (wargaResident.id === residentId) {
                return next();
            }
            // Check if it's a family member
            if (wargaResident.familyId && wargaResident.familyId === targetResident.familyId) {
                return next();
            }
            return res.status(403).json({ message: 'You can only access your own record and family members' });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking resident access' });
    }
});
exports.checkResidentAccess = checkResidentAccess;
