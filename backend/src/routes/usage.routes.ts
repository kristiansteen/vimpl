import { Router } from 'express';
import usageController from '../controllers/usage.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Called by voice-2-launch proxies — no user auth, secured by shared secret
router.post('/log', usageController.logUsage);

// Admin-only read endpoint
router.get('/admin', authenticate, requireAdmin, usageController.getAdminUsage);

export default router;
