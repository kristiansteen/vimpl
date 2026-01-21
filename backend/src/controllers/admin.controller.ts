import { Response } from 'express';
import loginAuditService from '../services/login-audit.service';
import subscriptionService from '../services/subscription.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

class AdminController {
  /**
   * Download all login audits as JSON
   * GET /api/v1/admin/login-audits/download
   */
  async downloadLoginAudits(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // In production, you'd check for admin role here
      // For now, any authenticated user can download their own audits
      
      const audits = await loginAuditService.exportAllLogins();

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="login-audits-${new Date().toISOString()}.json"`);

      res.json({
        exportDate: new Date().toISOString(),
        totalRecords: audits.length,
        audits
      });
    } catch (error) {
      logger.error('Download login audits error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to download login audits',
      });
    }
  }

  /**
   * Get login statistics
   * GET /api/v1/admin/login-audits/stats
   */
  async getLoginStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await loginAuditService.getLoginStats(startDate, endDate);

      res.json({ stats });
    } catch (error) {
      logger.error('Get login stats error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch login statistics',
      });
    }
  }

  /**
   * Get recent login audits
   * GET /api/v1/admin/login-audits
   */
  async getLoginAudits(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const filters = {
        userId: req.query.userId as string | undefined,
        email: req.query.email as string | undefined,
        success: req.query.success ? req.query.success === 'true' : undefined,
        loginMethod: req.query.loginMethod as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100
      };

      const audits = await loginAuditService.getLoginAudits(filters);

      res.json({ 
        audits,
        total: audits.length
      });
    } catch (error) {
      logger.error('Get login audits error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch login audits',
      });
    }
  }

  /**
   * Get user login history
   * GET /api/v1/admin/users/:userId/login-history
   */
  async getUserLoginHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const history = await loginAuditService.getUserLoginHistory(userId, limit);

      res.json({ history });
    } catch (error) {
      logger.error('Get user login history error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch user login history',
      });
    }
  }

  /**
   * Get all subscriptions
   * GET /api/v1/admin/subscriptions
   */
  async getAllSubscriptions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const subscriptions = await subscriptionService.getAllSubscriptions();

      res.json({ 
        subscriptions,
        total: subscriptions.length
      });
    } catch (error) {
      logger.error('Get all subscriptions error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch subscriptions',
      });
    }
  }
}

export default new AdminController();
