import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import config from '../config';
import logger from '../utils/logger';
import { createCommercialCheckoutSession, createPortalSession, isStripeConfigured } from '../services/stripe.service';

const router = Router();
router.use(authenticate);

function isAllowedRedirect(url: string): boolean {
  try {
    const origin = new URL(url).origin;
    return config.frontend.allowedOrigins.some(o => o.toLowerCase() === origin.toLowerCase())
      || origin.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

// POST /api/v1/billing/checkout — start a Commercial subscription checkout.
// Body: { returnUrl: string } — the app's own origin; success/cancel land back there.
router.post('/checkout', async (req: AuthRequest, res: Response) => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Service Unavailable', message: 'Billing is not configured yet.' });
      return;
    }

    const { returnUrl } = req.body;
    if (!returnUrl || !isAllowedRedirect(returnUrl)) {
      res.status(400).json({ error: 'Validation Error', message: 'Invalid returnUrl' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, stripeCustomerId: true, subscriptionTier: true },
    });
    if (!user) { res.status(404).json({ error: 'Not Found' }); return; }

    if (user.subscriptionTier === 'commercial' || user.subscriptionTier === 'enterprise') {
      res.status(400).json({ error: 'Validation Error', message: 'Already on a paid plan.' });
      return;
    }

    const base = returnUrl.replace(/\/+$/, '');
    const url = await createCommercialCheckoutSession({
      userId: user.id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      successUrl: `${base}?billing=success`,
      cancelUrl: `${base}?billing=cancelled`,
    });

    res.json({ url });
  } catch (error) {
    logger.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to start checkout' });
  }
});

// POST /api/v1/billing/portal — manage/cancel an existing subscription.
router.post('/portal', async (req: AuthRequest, res: Response) => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Service Unavailable', message: 'Billing is not configured yet.' });
      return;
    }

    const { returnUrl } = req.body;
    if (!returnUrl || !isAllowedRedirect(returnUrl)) {
      res.status(400).json({ error: 'Validation Error', message: 'Invalid returnUrl' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: 'Validation Error', message: 'No billing account on file.' });
      return;
    }

    const url = await createPortalSession(user.stripeCustomerId, returnUrl);
    res.json({ url });
  } catch (error) {
    logger.error('Create billing portal session error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to open billing portal' });
  }
});

export default router;
