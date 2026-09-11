import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import config from '../config';
import logger from '../utils/logger';
import { sendOnboardingEmail } from '../services/email.service';

const router = Router();

const ONBOARDING_DAYS = [0, 1, 2, 3, 5, 7];
const DAY_MS = 24 * 60 * 60 * 1000;

// Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically when
// the env var is named CRON_SECRET — this also blocks anyone else from hitting it.
function requireCron(req: Request, res: Response): boolean {
  if (!config.cronSecret || req.headers.authorization !== `Bearer ${config.cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// GET /api/v1/cron/onboarding — runs daily. For each onboarding day (0,1,2,3,5,7),
// finds users whose signup fell in that day's 24h window and hasn't had that
// milestone sent yet, and sends it. Older accounts' windows have already
// passed by the time this runs, so nothing is backfilled for them — only
// users who signed up on/after this went live get the drip.
router.get('/onboarding', async (req: Request, res: Response) => {
  if (!requireCron(req, res)) return;

  const now = Date.now();
  const results: { day: number; sent: string[]; failed: string[] }[] = [];

  try {
    for (const day of ONBOARDING_DAYS) {
      const windowEnd = new Date(now - day * DAY_MS);
      const windowStart = new Date(now - (day + 1) * DAY_MS);

      const users = await prisma.user.findMany({
        where: {
          createdAt: { gte: windowStart, lt: windowEnd },
          emailUnsubscribed: false,
          isActive: true,
          NOT: { sentOnboardingMilestones: { has: day } },
        },
        select: { id: true, email: true, name: true, sentOnboardingMilestones: true },
      });

      const sent: string[] = [];
      const failed: string[] = [];

      for (const user of users) {
        const ok = await sendOnboardingEmail(user.email, user.name || '', day);
        if (ok) {
          const milestones = Array.from(new Set([...user.sentOnboardingMilestones, day]));
          await prisma.user.update({ where: { id: user.id }, data: { sentOnboardingMilestones: milestones } });
          sent.push(user.email);
        } else {
          failed.push(user.email);
        }
      }

      if (sent.length || failed.length) {
        logger.info(`Onboarding cron day ${day}: sent ${sent.length}, failed ${failed.length}`);
      }
      results.push({ day, sent, failed });
    }

    res.json({ ok: true, results });
  } catch (error) {
    logger.error('Onboarding cron error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Onboarding cron failed' });
  }
});

export default router;
