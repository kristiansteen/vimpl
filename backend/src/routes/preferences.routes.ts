/**
 * User preferences for the Ailean app: GET returns them, PUT patches them.
 * Mounted at /api/v1/auth/me/preferences.
 */
import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import logger from '../utils/logger';
import { sanitizePreferences, mergePreferences } from '../services/preferences.policy';

const router = Router();

// The table is created by hand (prisma db push); until then answer 503, never 500
const tableMissing = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021';

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const row = await prisma.userPreference.findUnique({ where: { userId: req.user!.userId } });
    res.json({ preferences: row?.data ?? {} });
  } catch (e) {
    if (tableMissing(e)) { res.status(503).json({ error: 'Preferences not available yet' }); return; }
    logger.error('Get preferences error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/', authenticate, async (req: AuthRequest, res: Response) => {
  let patch;
  try {
    patch = sanitizePreferences(req.body);
  } catch (e) {
    res.status(400).json({ error: 'Bad Request', message: (e as Error).message });
    return;
  }
  try {
    const userId = req.user!.userId;
    const row = await prisma.userPreference.findUnique({ where: { userId } });
    const data = mergePreferences(row?.data, patch) as Prisma.InputJsonValue;
    const saved = await prisma.userPreference.upsert({ where: { userId }, create: { userId, data }, update: { data } });
    res.json({ preferences: saved.data });
  } catch (e) {
    if (tableMissing(e)) { res.status(503).json({ error: 'Preferences not available yet' }); return; }
    logger.error('Save preferences error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
