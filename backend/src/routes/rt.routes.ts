import express from 'express';
import * as rtController from '../controllers/rt.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createRTSchema, updateRTSchema } from '../schemas/rt.schema';

const router = express.Router();

// Protected routes - require authentication
router.get('/', authenticate, rtController.getAllRTs);
router.get('/dashboard/stats', authenticate, authorize(['RT']), rtController.getRTDashboardStats);
router.get('/:id', authenticate, rtController.getRTById);
router.get('/number/:number', authenticate, rtController.getRTByNumber);
router.get('/:id/statistics', authenticate, rtController.getRTStatistics);
router.get('/:id/residents', authenticate, rtController.getRTResidents);

// New routes for dashboard
router.get('/verifications/pending', authenticate, authorize(['RT']), rtController.getRTPendingVerifications);
router.get('/documents/pending', authenticate, authorize(['RT']), rtController.getRTPendingDocuments);
router.get('/events/upcoming', authenticate, authorize(['RT']), rtController.getRTUpcomingEvents);

// Routes for RW and Admin only
router.post(
  '/',
  authenticate,
  authorize(['RW', 'ADMIN']),
  validateRequest(createRTSchema),
  rtController.createRT
);

router.put(
  '/:id',
  authenticate,
  authorize(['RW', 'ADMIN']),
  validateRequest(updateRTSchema),
  rtController.updateRT
);

router.delete(
  '/:id',
  authenticate,
  authorize(['RW', 'ADMIN']),
  rtController.deleteRT
);

export default router;
