import { Router } from 'express';
import subscriptionController from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public route to get available tiers
router.get('/tiers', subscriptionController.getTiers);

// Authenticated routes
router.get('/current', authenticate, subscriptionController.getCurrentSubscription);
router.get('/can-create-board', authenticate, subscriptionController.canCreateBoard);
router.post('/upgrade', authenticate, subscriptionController.upgradeToCommercial);
router.post('/downgrade', authenticate, subscriptionController.downgradeToStudent);

export default router;
