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
exports.uploadFields = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const error_middleware_1 = require("./error.middleware");
// Utility to get the destination folder based on the route
const getDestination = (req) => {
    if (req.originalUrl.includes('/complaints')) {
        return 'complaints';
    }
    else if (req.originalUrl.includes('/documents')) {
        return 'documents';
    }
    else if (req.originalUrl.includes('/residents')) {
        return 'residents';
    }
    else if (req.originalUrl.includes('/events')) {
        return 'events';
    }
    else {
        return 'general'; // Default folder
    }
};
// Configure storage with dynamic destination and filename
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const folder = getDestination(req);
        const destPath = path_1.default.join(__dirname, `../../uploads/${folder}`);
        cb(null, destPath);
    },
    filename: (req, file, cb) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Extract resident data from request if available
            let nik = req.body.nik || req.params.nik || '';
            let noKK = req.body.noKK || req.params.noKK || '';
            const docType = req.body.docType || 'file';
            const residentId = req.params.id;
            // If we're uploading for a resident and don't have NIK/noKK, fetch from database
            if (getDestination(req) === 'residents' && residentId && (!nik || !noKK)) {
                const { PrismaClient } = require('@prisma/client');
                const prisma = new PrismaClient();
                try {
                    const resident = yield prisma.resident.findUnique({
                        where: { id: parseInt(residentId) }
                    });
                    if (resident) {
                        nik = resident.nik;
                        noKK = resident.noKK;
                    }
                    yield prisma.$disconnect();
                }
                catch (error) {
                    yield prisma.$disconnect();
                    console.error('Error fetching resident data:', error);
                }
            }
            // Create a unique filename
            let baseFilename = file.originalname.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
            const extension = path_1.default.extname(file.originalname).toLowerCase();
            let uniqueFilename = `${baseFilename}-${Date.now()}${extension}`;
            // Custom naming for resident documents
            if (getDestination(req) === 'residents') {
                if (docType.toLowerCase() === 'ktp' && nik) {
                    uniqueFilename = `ktp_${nik}${extension}`;
                }
                else if (docType.toLowerCase() === 'kk' && noKK) {
                    uniqueFilename = `kk_${noKK}${extension}`;
                }
            }
            cb(null, uniqueFilename);
        }
        catch (error) {
            cb(error, '');
        }
    }),
});
// File filter function to restrict file types
const fileFilter = (req, file, callback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true);
    }
    else {
        callback(new error_middleware_1.ApiError('Invalid file type. Only JPG, PNG, GIF, PDF, and Word documents are allowed.', 400));
    }
};
// Create multer instance with configuration
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max file size
    },
});
// Export middleware for different use cases
const uploadSingle = (fieldName) => upload.single(fieldName);
exports.uploadSingle = uploadSingle;
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
exports.uploadMultiple = uploadMultiple;
const uploadFields = (fields) => upload.fields(fields);
exports.uploadFields = uploadFields;
exports.default = upload;
