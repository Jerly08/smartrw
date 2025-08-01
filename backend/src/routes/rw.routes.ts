import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// RW Dashboard routes - require RW authentication
router.get('/dashboard/stats', authenticate, authorize(['RW']), dashboardController.getRWDashboardStats);
router.get('/dashboard/documents', authenticate, authorize(['RW']), dashboardController.getRWRecentDocuments);
router.get('/dashboard/events', authenticate, authorize(['RW']), dashboardController.getRWUpcomingEvents);

export default router;
