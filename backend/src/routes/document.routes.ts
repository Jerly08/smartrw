import express from 'express';
import * as documentController from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { checkDocumentAccess, checkDocumentProcessAccess } from '../middleware/document.middleware';
import { createDocumentSchema, updateDocumentSchema, processDocumentSchema, searchDocumentsSchema } from '../schemas/document.schema';
import { uploadMultiple } from '../middleware/upload.middleware';

const router = express.Router();

// Protected routes - require authentication
router.get(
  '/',
  authenticate,
  validateRequest(searchDocumentsSchema),
  documentController.getAllDocuments
);

router.get(
  '/statistics',
  authenticate,
  documentController.getDocumentStatistics
);

router.get(
  '/:id',
  authenticate,
  checkDocumentAccess,
  documentController.getDocumentById
);

// Add route to download document attachment
router.get(
  '/:id/attachments/:filename',
  authenticate,
  checkDocumentAccess,
  documentController.downloadAttachment
);

// Create document - all authenticated users can create documents
router.post(
  '/',
  authenticate,
  uploadMultiple('attachments', 5), // Allow up to 5 file attachments
  documentController.createDocument
);

// Update document - only the requester can update their own documents
router.put(
  '/:id',
  authenticate,
  checkDocumentAccess,
  uploadMultiple('attachments', 5), // Allow up to 5 file attachments
  validateRequest(updateDocumentSchema),
  documentController.updateDocument
);

// Process document - RT, RW, and Admin can process documents
router.post(
  '/:id/process',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkDocumentProcessAccess,
  validateRequest(processDocumentSchema),
  documentController.processDocument
);

// Delete document - only the requester can delete their own documents
router.delete(
  '/:id',
  authenticate,
  checkDocumentAccess,
  documentController.deleteDocument
);

export default router; 