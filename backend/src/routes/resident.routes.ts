import express from 'express';
import * as residentController from '../controllers/resident.controller';
import { authenticate, authorize, checkResidentAccess } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createResidentSchema, updateResidentSchema, verifyResidentSchema, importResidentsSchema } from '../schemas/resident.schema';

const router = express.Router();

// Protected routes - require authentication
router.get('/', authenticate, residentController.getAllResidents);
router.get('/statistics', authenticate, residentController.getResidentStatistics);
router.get('/:id', authenticate, checkResidentAccess, residentController.getResidentById);

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

router.put(
  '/:id',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkResidentAccess,
  validateRequest(updateResidentSchema),
  residentController.updateResident
);

router.delete(
  '/:id',
  authenticate,
  authorize(['RW', 'ADMIN']),
  residentController.deleteResident
);

router.post(
  '/:id/verify',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkResidentAccess,
  validateRequest(verifyResidentSchema),
  residentController.verifyResident
);

export default router; 