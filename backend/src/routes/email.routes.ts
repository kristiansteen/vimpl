import { Router, Request, Response } from 'express';
import express from 'express';
import prisma from '../config/database';
import config from '../config';
import logger from '../utils/logger';
import { verifyUnsubscribeToken } from '../services/onboarding.policy';

// Unsubscribe from onboarding emails. GET only shows a confirm button, because
// mail scanners open links; the unsubscribe itself is a POST (also used by the
// one-click List-Unsubscribe header).
const router = Router();
router.use(express.urlencoded({ extended: false }));

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function page(body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title></head>
<body style="margin:0;padding:48px 16px;background:#F1F1EE;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#141414">
<div style="max-width:460px;margin:0 auto;background:#fff;border:1px solid #DCDCD6;border-radius:10px;padding:32px">${body}</div></body></html>`;
}

function params(req: Request) {
  const src = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
  return { u: String(src.u || ''), t: String(src.t || '') };
}

router.get('/unsubscribe', (req: Request, res: Response) => {
  const { u, t } = params(req);
  if (!verifyUnsubscribeToken(u, t, config.jwt.secret)) {
    res.status(400).send(page('<p>This unsubscribe link is not valid. / Linket er ikke gyldigt.</p>'));
    return;
  }
  res.send(page(`
    <p style="margin:0 0 8px;font-size:18px;font-weight:600">Stop the onboarding emails?</p>
    <p style="margin:0 0 24px;color:#6B6B66">Stop introduktionsmails?</p>
    <form method="post" action="?u=${encodeURIComponent(u)}&amp;t=${esc(t)}">
      <button type="submit" style="background:#141414;color:#fff;border:0;border-radius:999px;padding:12px 22px;font-size:15px;font-weight:600;cursor:pointer">Unsubscribe / Afmeld</button>
    </form>`));
});

router.post('/unsubscribe', async (req: Request, res: Response) => {
  const { u, t } = params(req);
  if (!verifyUnsubscribeToken(u, t, config.jwt.secret)) {
    res.status(400).send(page('<p>This unsubscribe link is not valid. / Linket er ikke gyldigt.</p>'));
    return;
  }
  try {
    await prisma.user.update({ where: { id: u }, data: { emailUnsubscribed: true } });
    logger.info(`User ${u} unsubscribed from onboarding emails`);
    res.send(page('<p style="margin:0 0 8px;font-size:18px;font-weight:600">You are unsubscribed.</p><p style="margin:0;color:#6B6B66">Du er afmeldt.</p>'));
  } catch (error) {
    logger.error('Unsubscribe error:', error);
    res.status(500).send(page('<p>Something went wrong. Please reply to the email instead. / Noget gik galt. Svar i stedet på mailen.</p>'));
  }
});

export default router;
