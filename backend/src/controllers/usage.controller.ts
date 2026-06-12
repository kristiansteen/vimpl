import { Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

const CLAUDE_INPUT_COST_PER_TOKEN  = 3  / 1_000_000;  // $3 per 1M input tokens
const CLAUDE_OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;  // $15 per 1M output tokens
const ELEVENLABS_COST_PER_CHAR     = 0.0003;           // ~$0.30 per 1000 chars (turbo tier)

class UsageController {
  /**
   * POST /api/v1/usage/log
   * Secret check handled by requireUsageSecret middleware in the route file.
   */
  async logUsage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, provider, inputTokens, outputTokens, characters } = req.body;

      if (!userId || !provider) {
        res.status(400).json({ error: 'userId and provider are required' });
        return;
      }

      let estimatedCost: number | undefined;
      if (provider === 'claude' && (inputTokens || outputTokens)) {
        estimatedCost = (inputTokens || 0) * CLAUDE_INPUT_COST_PER_TOKEN +
                        (outputTokens || 0) * CLAUDE_OUTPUT_COST_PER_TOKEN;
      } else if (provider === 'elevenlabs' && characters) {
        estimatedCost = characters * ELEVENLABS_COST_PER_CHAR;
      }

      await prisma.apiUsage.create({
        data: { userId, provider, inputTokens, outputTokens, characters, estimatedCost },
      });

      res.status(201).json({ ok: true });
    } catch (error) {
      logger.error('Log usage error:', error);
      res.status(500).json({ error: 'Failed to log usage' });
    }
  }

  /**
   * GET /api/v1/usage/admin?days=30
   */
  async getAdminUsage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const days = Math.min(365, Math.max(1, parseInt((req.query.days as string) || '30')));
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const rows = await prisma.apiUsage.groupBy({
        by: ['userId', 'provider'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        _sum: { inputTokens: true, outputTokens: true, characters: true, estimatedCost: true },
      });

      const userIds = [...new Set(rows.map(r => r.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true, subscriptionTier: true },
      });
      const userMap = Object.fromEntries(users.map(u => [u.id, u]));

      const fallback = (userId: string) =>
        userMap[userId] || { id: userId, email: userId, name: null, subscriptionTier: null };

      const claudeRows = rows
        .filter(r => r.provider === 'claude')
        .map(r => ({
          user: fallback(r.userId),
          calls: r._count.id,
          inputTokens: r._sum.inputTokens || 0,
          outputTokens: r._sum.outputTokens || 0,
          estimatedCost: r._sum.estimatedCost || 0,
        }))
        .sort((a, b) => b.calls - a.calls);

      const elevenRows = rows
        .filter(r => r.provider === 'elevenlabs')
        .map(r => ({
          user: fallback(r.userId),
          calls: r._count.id,
          characters: r._sum.characters || 0,
          estimatedCost: r._sum.estimatedCost || 0,
        }))
        .sort((a, b) => b.calls - a.calls);

      res.json({ rows: claudeRows, elevenlabs: elevenRows });
    } catch (error) {
      logger.error('Get admin usage error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to get usage data' });
    }
  }
}

export default new UsageController();
