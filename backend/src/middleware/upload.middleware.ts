import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { ApiError } from './error.middleware';

// Utility to get the destination folder based on the route
const getDestination = (req: Request) => {
  if (req.originalUrl.includes('/complaints')) {
    return 'complaints';
  } else if (req.originalUrl.includes('/documents')) {
    return 'documents';
  } else if (req.originalUrl.includes('/residents')) {
    return 'residents';
  } else if (req.originalUrl.includes('/events')) {
    return 'events';
  } else {
    return 'general'; // Default folder
  }
};

// Configure storage with dynamic destination and filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getDestination(req);
    const destPath = path.join(__dirname, `../../uploads/${folder}`);
    cb(null, destPath);
  },
  filename: async (req, file, cb) => {
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
          const resident = await prisma.resident.findUnique({
            where: { id: parseInt(residentId) }
          });
          
          if (resident) {
            nik = resident.nik;
            noKK = resident.noKK;
          }
          
          await prisma.$disconnect();
        } catch (error) {
          await prisma.$disconnect();
          console.error('Error fetching resident data:', error);
        }
      }
      
      // Create a unique filename
      let baseFilename = file.originalname.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
      const extension = path.extname(file.originalname).toLowerCase();
      
      let uniqueFilename = `${baseFilename}-${Date.now()}${extension}`;

      // Custom naming for resident documents
      if (getDestination(req) === 'residents') {
        if (docType.toLowerCase() === 'ktp' && nik) {
          uniqueFilename = `ktp_${nik}${extension}`;
        } else if (docType.toLowerCase() === 'kk' && noKK) {
          uniqueFilename = `kk_${noKK}${extension}`;
        }
      }

      cb(null, uniqueFilename);
    } catch (error) {
      cb(error as Error, '');
    }
  },
});

// File filter function to restrict file types
const fileFilter = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new ApiError('Invalid file type. Only JPG, PNG, GIF, PDF, and Word documents are allowed.', 400));
  }
};

// Create multer instance with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size
  },
});

// Export middleware for different use cases
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string, maxCount: number }[]) => upload.fields(fields);

export default upload;
