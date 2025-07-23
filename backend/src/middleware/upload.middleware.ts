import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure storage
const storage = multer.memoryStorage();

// File filter function to restrict file types
const fileFilter = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  // Accept images and PDFs
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed.'));
  }
};

// Create multer instance with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Export middleware for different use cases
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string, maxCount: number }[]) => upload.fields(fields);

export default upload; 