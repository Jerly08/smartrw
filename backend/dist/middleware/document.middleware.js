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
exports.checkDocumentProcessAccess = exports.checkDocumentAccess = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Middleware to check if user can access a specific document
const checkDocumentAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const documentId = parseInt(req.params.id);
        if (isNaN(documentId)) {
            return res.status(400).json({ message: 'Invalid document ID' });
        }
        // Admin and RW have full access to all documents
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // Get the document
        const document = yield prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (req.user.role === 'RT') {
            // RT can only access documents from residents in their RT
            const rtResident = yield prisma.resident.findFirst({
                where: { userId: req.user.id },
            });
            if (!rtResident) {
                return res.status(403).json({ message: 'RT profile not found' });
            }
            // Get requester's resident record
            const requesterResident = yield prisma.resident.findFirst({
                where: { userId: document.requesterId },
            });
            if (!requesterResident) {
                return res.status(403).json({ message: 'Requester profile not found' });
            }
            // Check if requester is in RT's area
            if (requesterResident.rtNumber !== rtResident.rtNumber ||
                requesterResident.rwNumber !== rtResident.rwNumber) {
                return res.status(403).json({ message: 'You can only access documents from residents in your RT' });
            }
        }
        else if (req.user.role === 'WARGA') {
            // Warga can only access their own documents
            if (document.requesterId !== req.user.id) {
                return res.status(403).json({ message: 'You can only access your own documents' });
            }
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking document access' });
    }
});
exports.checkDocumentAccess = checkDocumentAccess;
// Middleware to check if user can process a document
const checkDocumentProcessAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const documentId = parseInt(req.params.id);
        if (isNaN(documentId)) {
            return res.status(400).json({ message: 'Invalid document ID' });
        }
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        // Get the document
        const document = yield prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        // Check based on role and status
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            // Admin and RW can process documents to any status
            // But need to follow the workflow
            switch (status) {
                case 'DIPROSES':
                    if (document.status !== 'DIAJUKAN') {
                        return res.status(403).json({ message: 'Document must be in DIAJUKAN status to be processed' });
                    }
                    break;
                case 'DITOLAK':
                    if (!['DIAJUKAN', 'DIPROSES'].includes(document.status)) {
                        return res.status(403).json({ message: 'Document must be in DIAJUKAN or DIPROSES status to be rejected' });
                    }
                    break;
                case 'DISETUJUI':
                    if (document.status !== 'DIPROSES') {
                        return res.status(403).json({ message: 'Document must be in DIPROSES status to be approved' });
                    }
                    break;
                case 'DITANDATANGANI':
                    if (document.status !== 'DISETUJUI') {
                        return res.status(403).json({ message: 'Document must be in DISETUJUI status to be signed' });
                    }
                    break;
                case 'SELESAI':
                    if (document.status !== 'DITANDATANGANI') {
                        return res.status(403).json({ message: 'Document must be in DITANDATANGANI status to be completed' });
                    }
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid status' });
            }
        }
        else if (req.user.role === 'RT') {
            // RT can only recommend (DIPROSES) or reject documents
            if (status !== 'DIPROSES' && status !== 'DITOLAK') {
                return res.status(403).json({ message: 'RT can only process or reject documents' });
            }
            // Check if document is in the correct state
            if (document.status !== 'DIAJUKAN') {
                return res.status(403).json({ message: 'Document must be in DIAJUKAN status to be processed by RT' });
            }
            // Check if document is from a resident in RT's area
            const rtResident = yield prisma.resident.findFirst({
                where: { userId: req.user.id },
            });
            if (!rtResident) {
                return res.status(403).json({ message: 'RT profile not found' });
            }
            // Get requester's resident record
            const requesterResident = yield prisma.resident.findFirst({
                where: { userId: document.requesterId },
            });
            if (!requesterResident) {
                return res.status(403).json({ message: 'Requester profile not found' });
            }
            // Check if requester is in RT's area
            if (requesterResident.rtNumber !== rtResident.rtNumber ||
                requesterResident.rwNumber !== rtResident.rwNumber) {
                return res.status(403).json({ message: 'You can only process documents from residents in your RT' });
            }
        }
        else {
            // Warga cannot process documents
            return res.status(403).json({ message: 'You do not have permission to process documents' });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking document process access' });
    }
});
exports.checkDocumentProcessAccess = checkDocumentProcessAccess;
