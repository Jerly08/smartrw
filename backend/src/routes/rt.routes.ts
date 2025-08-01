import express from 'express';
import * as rtController from '../controllers/rt.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createRTSchema, updateRTSchema } from '../schemas/rt.schema';

const router = express.Router();

// Protected routes - require authentication
router.get('/', authenticate, rtController.getAllRTs);
router.get('/dashboard/stats', authenticate, authorize(['RT']), dashboardController.getRTDashboardStats);
router.get('/:id', authenticate, rtController.getRTById);
router.get('/number/:number', authenticate, rtController.getRTByNumber);
router.get('/:id/statistics', authenticate, rtController.getRTStatistics);
router.get('/:id/residents', authenticate, rtController.getRTResidents);

// New routes for dashboard
router.get('/verifications/pending', authenticate, authorize(['RT']), dashboardController.getRTPendingVerifications);
router.get('/documents/pending', authenticate, authorize(['RT']), dashboardController.getRTPendingDocuments);
router.get('/events/upcoming', authenticate, authorize(['RT']), dashboardController.getRTUpcomingEvents);
router.post('/verifications/:id/process', authenticate, authorize(['RT']), dashboardController.processVerification);
router.post('/documents/:id/recommend', authenticate, authorize(['RT']), dashboardController.processDocumentRecommendation);

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
