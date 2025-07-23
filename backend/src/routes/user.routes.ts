import express from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateUserSchema, updateUserRoleSchema, linkUserToResidentSchema } from '../schemas/user.schema';

const router = express.Router();

// Admin only routes
router.get('/', authenticate, authorize(['ADMIN']), userController.getAllUsers);
router.delete('/:id', authenticate, authorize(['ADMIN']), userController.deleteUser);
router.put(
  '/:id/role',
  authenticate,
  authorize(['ADMIN']),
  validateRequest(updateUserRoleSchema),
  userController.updateUserRole
);

// Protected routes (accessible by the user themselves or admins)
router.get('/:id', authenticate, userController.getUserById);
router.put(
  '/:id',
  authenticate,
  validateRequest(updateUserSchema),
  userController.updateUser
);

// RT, RW, Admin routes
router.post(
  '/:id/link-resident',
  authenticate,
  authorize(['RT', 'RW', 'ADMIN']),
  validateRequest(linkUserToResidentSchema),
  userController.linkUserToResident
);

export default router; 