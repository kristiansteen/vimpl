import { Router } from 'express';
import portfolioController from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All portfolio routes require authentication
router.get('/dashboard', authenticate, portfolioController.getDashboard);
router.get('/comparison', authenticate, portfolioController.getBoardComparison);
router.get('/activity', authenticate, portfolioController.getRecentActivity);

export default router;
