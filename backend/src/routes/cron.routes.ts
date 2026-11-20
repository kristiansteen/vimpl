import { Router, Request, Response } from 'express';
import config from '../config';
import logger from '../utils/logger';
import { runOnboarding } from '../services/onboarding.service';

const router = Router();


// Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically when
// the env var is named CRON_SECRET — this also blocks anyone else from hitting it.
function requireCron(req: Request, res: Response): boolean {
  if (!config.cronSecret || req.headers.authorization !== `Bearer ${config.cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// GET /api/v1/cron/onboarding — runs daily. Sends each user in their first nine
// days the onboarding email that is due (see onboarding.policy dueMilestone).
router.get('/onboarding', async (req: Request, res: Response) => {
  if (!requireCron(req, res)) return;
  try {
    res.json({ ok: true, ...(await runOnboarding()) });
  } catch (error) {
    logger.error('Onboarding cron error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Onboarding cron failed' });
  }
});

export default router;
