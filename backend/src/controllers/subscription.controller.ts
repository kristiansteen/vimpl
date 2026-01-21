import { Response } from 'express';
import subscriptionService, { SUBSCRIPTION_TIERS } from '../services/subscription.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

class SubscriptionController {
  /**
   * Get subscription tiers
   * GET /api/v1/subscription/tiers
   */
  async getTiers(_req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json({
        tiers: Object.values(SUBSCRIPTION_TIERS)
      });
    } catch (error) {
      logger.error('Get tiers error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch subscription tiers',
      });
    }
  }

  /**
   * Get current user subscription
   * GET /api/v1/subscription/current
   */
  async getCurrentSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const stats = await subscriptionService.getUserBoardStats(req.user.userId);
      const tierDetails = subscriptionService.getTierDetails('student'); // Will be updated with actual tier

      res.json({
        subscription: {
          tier: tierDetails.name,
          ...stats
        }
      });
    } catch (error) {
      logger.error('Get current subscription error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch subscription',
      });
    }
  }

  /**
   * Check if user can create board
   * GET /api/v1/subscription/can-create-board
   */
  async canCreateBoard(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await subscriptionService.canCreateBoard(req.user.userId);

      res.json(result);
    } catch (error) {
      logger.error('Can create board error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to check board creation permission',
      });
    }
  }

  /**
   * Upgrade to commercial
   * POST /api/v1/subscription/upgrade
   */
  async upgradeToCommercial(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // In production, this would integrate with Stripe
      // For now, we'll directly upgrade the user
      const user = await subscriptionService.upgradeToCommercial(req.user.userId);

      res.json({
        message: 'Successfully upgraded to Commercial plan',
        subscription: {
          tier: user.subscriptionTier,
          status: user.subscriptionStatus,
          endDate: user.subscriptionEndDate
        }
      });
    } catch (error) {
      logger.error('Upgrade subscription error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to upgrade subscription',
      });
    }
  }

  /**
   * Downgrade to student
   * POST /api/v1/subscription/downgrade
   */
  async downgradeToStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await subscriptionService.downgradeToStudent(req.user.userId);

      res.json({
        message: 'Downgraded to Student plan',
        subscription: {
          tier: user.subscriptionTier,
          status: user.subscriptionStatus
        }
      });
    } catch (error) {
      logger.error('Downgrade subscription error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to downgrade subscription',
      });
    }
  }
}

export default new SubscriptionController();
