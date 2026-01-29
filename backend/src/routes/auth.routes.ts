import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { googleLogin, googleCallback } from '../auth/googleAuth';

const router = Router();

// Email/Password authentication
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/verify-email', authController.verifyEmail);

// Protected route - get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Google OAuth routes
router.get('/google', googleLogin);

router.get(
  '/google/callback',
  googleCallback,
  authController.googleCallback
);

// Failure route
router.get('/google/failure', (_req, res) => {
  res.status(401).json({
    error: 'Authentication Failed',
    message: 'Google authentication failed',
  });
});

export default router;
