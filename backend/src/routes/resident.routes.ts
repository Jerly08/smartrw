import express from 'express';
import * as residentController from '../controllers/resident.controller';
import { authenticate, authorize, checkResidentAccess } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createResidentSchema, updateResidentSchema, verifyResidentSchema, importResidentsSchema } from '../schemas/resident.schema';
import { uploadSingle } from '../middleware/upload.middleware';

const router = express.Router();

// Protected routes - require authentication
router.get('/', authenticate, residentController.getAllResidents);
router.get('/statistics', authenticate, residentController.getResidentStatistics);

// Get residents pending verification for RT - MUST be before /:id route
router.get(
  '/pending-verification',
  authenticate,
  authorize(['RT']),
  residentController.getPendingVerification
);

// Get residents for specific RT - used in RT dashboard
router.get(
  '/rt-residents',
  authenticate,
  authorize(['RT']),
  residentController.getResidentsForRT
);

router.get('/:id', authenticate, checkResidentAccess, residentController.getResidentById);

// Get resident documents
router.get('/:id/documents', authenticate, checkResidentAccess, residentController.getResidentDocuments);

// Upload document for resident
router.post(
  '/:id/documents/upload',
  authenticate,
  checkResidentAccess,
  uploadSingle('document'),
  residentController.uploadResidentDocument
);

// Get social assistance history for a resident
router.get('/:id/social-assistance', authenticate, checkResidentAccess, residentController.getResidentSocialAssistance);

// Routes for RT, RW, and Admin
router.post(
  '/',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  validateRequest(createResidentSchema),
  residentController.createResident
);

router.post(
  '/import',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  validateRequest(importResidentsSchema),
  residentController.importResidents
);

router.get(
  '/export',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  residentController.exportResidents
);

router.put(
  '/:id',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkResidentAccess,
  validateRequest(updateResidentSchema),
  residentController.updateResident
);

router.patch(
  '/:id/verify',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkResidentAccess,
  validateRequest(verifyResidentSchema),
  residentController.verifyResident
);

// Verify resident by RT
router.patch(
  '/:id/verify-by-rt',
  authenticate,
  authorize(['RT']),
  residentController.verifyByRT
);

router.delete(
  '/:id',
  authenticate,
  authorize(['RW', 'ADMIN']),
  residentController.deleteResident
);

export default router;
