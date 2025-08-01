import express from 'express';
import * as socialAssistanceController from '../controllers/socialAssistance.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  checkSocialAssistanceAccess,
  checkRecipientAccess,
  checkVerificationAccess
} from '../middleware/socialAssistance.middleware';
import { 
  createSocialAssistanceSchema,
  updateSocialAssistanceSchema,
  searchSocialAssistanceSchema,
  addRecipientSchema,
  updateRecipientSchema
} from '../schemas/socialAssistance.schema';

const router = express.Router();

// Get all social assistance programs (public, but with different data based on role)
router.get(
  '/',
  authenticate,
  validateRequest(searchSocialAssistanceSchema),
  socialAssistanceController.getAllSocialAssistance
);

// Get social assistance statistics
router.get(
  '/statistics',
  authenticate,
  socialAssistanceController.getSocialAssistanceStatistics
);

// Check eligibility for a resident
router.get(
  '/eligibility/:residentId',
  authenticate,
  socialAssistanceController.checkResidentEligibility
);

// Get social assistance by ID (accessible by all authenticated users)
router.get(
  '/:id',
  authenticate,
  checkSocialAssistanceAccess,
  socialAssistanceController.getSocialAssistanceById
);

// Create social assistance program (only Admin and RW)
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'RW']),
  validateRequest(createSocialAssistanceSchema),
  socialAssistanceController.createSocialAssistance
);

// Update social assistance program (only Admin and RW)
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'RW']),
  validateRequest(updateSocialAssistanceSchema),
  socialAssistanceController.updateSocialAssistance
);

// Delete social assistance program (only Admin and RW)
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'RW']),
  socialAssistanceController.deleteSocialAssistance
);

// Update social assistance status (only Admin and RW)
router.patch(
  '/:id/status',
  authenticate,
  authorize(['ADMIN', 'RW']),
  socialAssistanceController.updateSocialAssistanceStatus
);

// Get recipients for a social assistance program
router.get(
  '/:id/recipients',
  authenticate,
  checkSocialAssistanceAccess,
  socialAssistanceController.getSocialAssistanceRecipients
);

// Export recipients to CSV
router.get(
  '/:id/recipients/export',
  authenticate,
  authorize(['ADMIN', 'RW', 'RT']),
  socialAssistanceController.exportRecipients
);

// Add recipient to a social assistance program (only Admin and RW)
router.post(
  '/:id/recipients',
  authenticate,
  authorize(['ADMIN', 'RW']),
  validateRequest(addRecipientSchema),
  socialAssistanceController.addRecipient
);

// Update recipient information (Admin, RW, and RT for their area can verify)
router.put(
  '/:assistanceId/recipients/:recipientId',
  authenticate,
  checkRecipientAccess,
  validateRequest(updateRecipientSchema),
  socialAssistanceController.updateRecipient
);

// Verify recipient (Admin, RW, and RT for their area)
router.patch(
  '/:assistanceId/recipients/:recipientId/verify',
  authenticate,
  checkVerificationAccess,
  socialAssistanceController.updateRecipient
);

// Remove recipient from program (only Admin and RW)
router.delete(
  '/:assistanceId/recipients/:recipientId',
  authenticate,
  authorize(['ADMIN', 'RW']),
  socialAssistanceController.removeRecipient
);

export default router; 