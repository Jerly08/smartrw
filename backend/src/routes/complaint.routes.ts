import express from 'express';
import * as complaintController from '../controllers/complaint.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  checkComplaintAccess, 
  checkComplaintUpdateAccess, 
  checkComplaintRespondAccess 
} from '../middleware/complaint.middleware';
import { 
  createComplaintSchema, 
  updateComplaintSchema, 
  respondComplaintSchema,
  searchComplaintsSchema
} from '../schemas/complaint.schema';
import { uploadMultiple } from '../middleware/upload.middleware';

const router = express.Router();

// Get all complaints
router.get(
  '/',
  authenticate,
  validateRequest(searchComplaintsSchema),
  complaintController.getAllComplaints
);

// Get complaint statistics
router.get(
  '/statistics',
  authenticate,
  complaintController.getComplaintStatistics
);

// Get complaint by ID
router.get(
  '/:id',
  authenticate,
  checkComplaintAccess,
  complaintController.getComplaintById
);

// Create complaint - all authenticated users can create complaints
router.post(
  '/',
  authenticate,
  uploadMultiple('attachments', 5), // Allow up to 5 file attachments
  validateRequest(createComplaintSchema),
  complaintController.createComplaint
);

// Update complaint - only complaint creator, RT (for their RT), RW, and Admin can update complaints
router.put(
  '/:id',
  authenticate,
  checkComplaintUpdateAccess,
  uploadMultiple('attachments', 5), // Allow up to 5 file attachments
  validateRequest(updateComplaintSchema),
  complaintController.updateComplaint
);

// Delete complaint - only complaint creator (if still in DITERIMA status), RW, and Admin can delete complaints
router.delete(
  '/:id',
  authenticate,
  complaintController.deleteComplaint
);

// Respond to complaint - only RT (for their RT), RW, and Admin can respond to complaints
router.post(
  '/:id/respond',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  checkComplaintRespondAccess,
  validateRequest(respondComplaintSchema),
  complaintController.respondToComplaint
);

// Download complaint attachment
router.get(
  '/:id/attachments/:filename',
  authenticate,
  checkComplaintAccess,
  complaintController.downloadAttachment
);

export default router; 