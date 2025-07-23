import express from 'express';
import * as familyController from '../controllers/family.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createFamilySchema, updateFamilySchema, addFamilyMemberSchema } from '../schemas/family.schema';

const router = express.Router();

// Protected routes - require authentication
router.get('/', authenticate, familyController.getAllFamilies);
router.get('/:id', authenticate, familyController.getFamilyById);
router.get('/kk/:noKK', authenticate, familyController.getFamilyByKK);

// Routes for RT, RW, and Admin
router.post(
  '/',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  validateRequest(createFamilySchema),
  familyController.createFamily
);

router.put(
  '/:id',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  validateRequest(updateFamilySchema),
  familyController.updateFamily
);

router.delete(
  '/:id',
  authenticate,
  authorize(['RW', 'ADMIN']),
  familyController.deleteFamily
);

// Family member management
router.post(
  '/:id/members',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  validateRequest(addFamilyMemberSchema),
  familyController.addFamilyMember
);

router.delete(
  '/:id/members/:residentId',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  familyController.removeFamilyMember
);

export default router; 