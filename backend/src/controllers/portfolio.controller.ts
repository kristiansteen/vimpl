import { Response } from 'express';
import portfolioService from '../services/portfolio.service';
import subscriptionService from '../services/subscription.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

class PortfolioController {
  /**
   * Get portfolio dashboard
   * GET /api/v1/portfolio/dashboard
   */
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has commercial subscription (required for portfolio)
      const user = await subscriptionService.getTierDetails(req.user.userId);

      const dashboard = await portfolioService.getPortfolioDashboard(req.user.userId);

      res.json({
        dashboard,
        requiresCommercial: dashboard.user.subscriptionTier !== 'commercial'
      });
    } catch (error) {
      logger.error('Get portfolio dashboard error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch portfolio dashboard',
      });
    }
  }

  /**
   * Get board comparison
   * GET /api/v1/portfolio/comparison
   */
  async getPortfolioStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Platform admin check would go here
      const _user = req.user;

      const stats = await portfolioService.getPortfolioStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching portfolio stats:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch portfolio stats',
      });
    }
  }

  /**
   * Get board comparison
   * GET /api/v1/portfolio/comparison
   */
  async getBoardComparison(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const comparison = await portfolioService.getBoardComparison(req.user.userId);

      res.json({ comparison });
    } catch (error) {
      logger.error('Get board comparison error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch board comparison',
      });
    }
  }

  /**
   * Get recent activity across all boards
   * GET /api/v1/portfolio/activity
   */
  async getRecentActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const activity = await portfolioService.getRecentActivity(req.user.userId, limit);

      res.json({ activity });
    } catch (error) {
      logger.error('Get recent activity error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch recent activity',
      });
    }
  }
}

export default new PortfolioController();
