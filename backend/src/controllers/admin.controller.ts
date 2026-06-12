import { Response } from 'express';
import prisma from '../config/database';
import loginAuditService from '../services/login-audit.service';
import subscriptionService, { SUBSCRIPTION_TIERS } from '../services/subscription.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const VALID_TIERS = Object.values(SUBSCRIPTION_TIERS).map((t: any) => t.id);

function parsePagination(query: any): { page: number; limit: number; skip: number } {
  const page  = Math.max(1, parseInt(query.page  || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50')));
  return { page, limit, skip: (page - 1) * limit };
}

class AdminController {
  // ── Stats ─────────────────────────────────────────────────────────────

  async getStats(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        studentUsers,
        commercialUsers,
        enterpriseUsers,
        activeWeekly,
        newLast30,
        newLast7,
        dau,
        signupsByDay,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { subscriptionTier: 'student' } }),
        prisma.user.count({ where: { subscriptionTier: 'commercial' } }),
        prisma.user.count({ where: { subscriptionTier: 'enterprise' } }),
        prisma.user.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: oneDayAgo } } }),
        prisma.$queryRaw<{ day: Date; count: bigint }[]>`
          SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::int AS count
          FROM users
          WHERE created_at >= ${thirtyDaysAgo}
          GROUP BY day ORDER BY day ASC
        `,
      ]);

      res.json({
        totals: { users: totalUsers, trial: studentUsers, commercial: commercialUsers, enterprise: enterpriseUsers },
        activity: { dau, activeWeekly, newLast7, newLast30 },
        signupsByDay: signupsByDay.map((r) => ({ day: r.day, count: Number(r.count) })),
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to get stats' });
    }
  }

  // ── Users ─────────────────────────────────────────────────────────────

  async listUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string) || '';
      const tier = (req.query.tier as string) || '';
      const { page, limit, skip } = parsePagination(req.query);

      const where: any = {};
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (tier && VALID_TIERS.includes(tier)) where.subscriptionTier = tier;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true, email: true, name: true, authProvider: true,
            subscriptionTier: true, subscriptionStatus: true, subscriptionEndDate: true,
            isActive: true, isAdmin: true, emailUnsubscribed: true,
            createdAt: true, lastLoginAt: true,
            _count: { select: { boards: true, loginAudits: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip, take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      res.json({ users, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
      logger.error('List users error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to list users' });
    }
  }

  async getUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, name: true, avatarUrl: true, authProvider: true,
          emailVerified: true, subscriptionTier: true, subscriptionStatus: true,
          subscriptionStartDate: true, subscriptionEndDate: true,
          stripeCustomerId: true, stripeSubscriptionId: true,
          isActive: true, isAdmin: true, emailUnsubscribed: true,
          sentOnboardingMilestones: true,
          createdAt: true, updatedAt: true, lastLoginAt: true,
          boards: {
            select: {
              id: true, title: true, slug: true, isPublic: true,
              createdAt: true, updatedAt: true,
              _count: { select: { sections: true, postits: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 20,
          },
          flows: {
            select: { id: true, name: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
          },
          loginAudits: {
            select: { id: true, success: true, loginMethod: true, ipAddress: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!user) { res.status(404).json({ error: 'Not Found', message: 'User not found' }); return; }
      res.json({ user });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to get user' });
    }
  }

  async updateSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { tier, status, endDate } = req.body;

      if (tier && !VALID_TIERS.includes(tier)) {
        res.status(400).json({ error: 'Validation Error', message: `Invalid tier. Use: ${VALID_TIERS.join(', ')}` });
        return;
      }

      const data: any = {};
      if (tier) data.subscriptionTier = tier;
      if (status) data.subscriptionStatus = status;
      if (endDate !== undefined) data.subscriptionEndDate = endDate ? new Date(endDate) : null;

      const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: { id: true, email: true, subscriptionTier: true, subscriptionStatus: true, subscriptionEndDate: true },
      });

      logger.info(`Admin updated subscription for ${user.email}: tier=${user.subscriptionTier}`);
      res.json({ user });
    } catch (error: any) {
      if (error.code === 'P2025') { res.status(404).json({ error: 'Not Found', message: 'User not found' }); return; }
      logger.error('Update subscription error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to update subscription' });
    }
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, isAdmin: true } });

      if (!user) { res.status(404).json({ error: 'Not Found', message: 'User not found' }); return; }
      if (user.isAdmin) { res.status(403).json({ error: 'Forbidden', message: 'Cannot delete an admin account' }); return; }

      await prisma.user.delete({ where: { id: userId } });
      logger.info(`Admin deleted user ${user.email} (${userId})`);
      res.json({ message: `User ${user.email} deleted successfully` });
    } catch (error: any) {
      if (error.code === 'P2025') { res.status(404).json({ error: 'Not Found', message: 'User not found' }); return; }
      logger.error('Delete user error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to delete user' });
    }
  }

  // ── Boards ────────────────────────────────────────────────────────────

  async listBoards(req: AuthRequest, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string) || '';
      const { page, limit, skip } = parsePagination(req.query);

      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [boards, total] = await Promise.all([
        prisma.board.findMany({
          where,
          select: {
            id: true, title: true, slug: true, isPublic: true, createdAt: true, updatedAt: true,
            user: { select: { id: true, email: true, name: true, subscriptionTier: true } },
            _count: { select: { sections: true, postits: true, collaborators: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip, take: limit,
        }),
        prisma.board.count({ where }),
      ]);

      res.json({ boards, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
      logger.error('List boards error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to list boards' });
    }
  }

  async getBoard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { boardId } = req.params;
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          user: { select: { id: true, email: true, name: true, subscriptionTier: true } },
          collaborators: {
            include: { user: { select: { id: true, email: true, name: true } } },
            orderBy: { invitedAt: 'desc' },
          },
          _count: { select: { sections: true, postits: true } },
        },
      });

      if (!board) { res.status(404).json({ error: 'Not Found', message: 'Board not found' }); return; }
      res.json({ board });
    } catch (error) {
      logger.error('Get board error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to get board' });
    }
  }

  async addCollaborator(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { boardId } = req.params;
      const { email, permission = 'edit' } = req.body;

      if (!email) { res.status(400).json({ error: 'Validation Error', message: 'email is required' }); return; }

      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!user) { res.status(404).json({ error: 'Not Found', message: 'User not found' }); return; }

      const collab = await prisma.boardCollaborator.upsert({
        where: { boardId_userId: { boardId, userId: user.id } },
        update: { permission },
        create: { boardId, userId: user.id, permission },
      });

      res.json({ collaborator: collab });
    } catch (error) {
      logger.error('Add collaborator error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to add collaborator' });
    }
  }

  async removeCollaborator(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { boardId, userId } = req.params;
      await prisma.boardCollaborator.deleteMany({ where: { boardId, userId } });
      res.json({ message: 'Collaborator removed' });
    } catch (error) {
      logger.error('Remove collaborator error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to remove collaborator' });
    }
  }

  // ── Login audits (legacy) ─────────────────────────────────────────────

  async downloadLoginAudits(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const audits = await loginAuditService.exportAllLogins();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="login-audits-${new Date().toISOString()}.json"`);
      res.json({ exportDate: new Date().toISOString(), totalRecords: audits.length, audits });
    } catch (error) {
      logger.error('Download login audits error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to download login audits' });
    }
  }

  async getLoginStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await loginAuditService.getLoginStats(startDate, endDate);
      res.json({ stats });
    } catch (error) {
      logger.error('Get login stats error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to fetch login statistics' });
    }
  }

  async getLoginAudits(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        userId: req.query.userId as string | undefined,
        email: req.query.email as string | undefined,
        success: req.query.success ? req.query.success === 'true' : undefined,
        loginMethod: req.query.loginMethod as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      };
      const audits = await loginAuditService.getLoginAudits(filters);
      res.json({ audits, total: audits.length });
    } catch (error) {
      logger.error('Get login audits error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to fetch login audits' });
    }
  }

  async getUserLoginHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await loginAuditService.getUserLoginHistory(userId, limit);
      res.json({ history });
    } catch (error) {
      logger.error('Get user login history error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to fetch user login history' });
    }
  }

  async getAllSubscriptions(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const subscriptions = await subscriptionService.getAllSubscriptions();
      res.json({ subscriptions, total: subscriptions.length });
    } catch (error) {
      logger.error('Get all subscriptions error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to fetch subscriptions' });
    }
  }
}

export default new AdminController();
