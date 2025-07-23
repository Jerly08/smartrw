import express from 'express';
import * as authController from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from '../schemas/auth.schema';

const router = express.Router();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validateRequest(updateProfileSchema), authController.updateProfile);
router.put(
  '/password',
  authenticate,
  validateRequest(changePasswordSchema),
  authController.changePassword
);

// Admin only routes
router.post(
  '/register-admin',
  authenticate,
  authorize(['ADMIN']),
  validateRequest(registerSchema),
  authController.register
);

export default router; 