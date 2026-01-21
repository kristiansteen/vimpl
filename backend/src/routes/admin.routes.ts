import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication
// In production, add an admin role check middleware here

// Login audit routes
router.get('/login-audits/download', authenticate, adminController.downloadLoginAudits);
router.get('/login-audits/stats', authenticate, adminController.getLoginStats);
router.get('/login-audits', authenticate, adminController.getLoginAudits);
router.get('/users/:userId/login-history', authenticate, adminController.getUserLoginHistory);

// Subscription management
router.get('/subscriptions', authenticate, adminController.getAllSubscriptions);

export default router;
