import { Router, Request, Response, NextFunction } from 'express';
import usageController from '../controllers/usage.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

function requireUsageSecret(req: Request, res: Response, next: NextFunction): void {
  if (req.headers['x-usage-secret'] !== process.env.USAGE_LOG_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// Called by voice-2-launch proxies — secured by shared secret
router.post('/log', requireUsageSecret, usageController.logUsage);

// Admin-only read endpoint
router.get('/admin', authenticate, requireAdmin, usageController.getAdminUsage);

export default router;
