import express from 'express';
import * as authController from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadFields } from '../middleware/upload.middleware';
import { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema, verifyResidentSchema } from '../schemas/auth.schema';

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

// Verification routes
router.get('/rts', authenticate, authController.getAvailableRTs);
router.post(
  '/verify-resident',
  authenticate,
  validateRequest(verifyResidentSchema),
  authController.verifyResident
);

// Route for uploading verification documents
router.post(
  '/upload-verification',
  authenticate,
  uploadFields([
    { name: 'ktp', maxCount: 1 },
    { name: 'kk', maxCount: 1 },
  ]),
  authController.uploadVerificationDocuments
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