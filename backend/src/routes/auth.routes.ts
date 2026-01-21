import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import passport from '../config/passport';

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
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/v1/auth/google/failure',
  }),
  authController.googleCallback
);

router.get('/google/failure', (req, res) => {
  res.status(401).json({
    error: 'Authentication Failed',
    message: 'Google authentication failed',
  });
});

export default router;
