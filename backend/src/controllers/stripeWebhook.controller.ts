import { Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../config/database';
import logger from '../utils/logger';
import { verifyWebhookSignature, isStripeConfigured } from '../services/stripe.service';

// Mounted with express.raw() in server.ts — must run BEFORE the global
// express.json() middleware, since Stripe signature verification needs the
// exact raw request body bytes, not a re-serialized parsed object.
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Billing is not configured yet.' });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    res.status(400).json({ error: 'Validation Error', message: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(req.body, signature);
  } catch (error) {
    logger.error('Stripe webhook signature verification failed:', error);
    res.status(400).json({ error: 'Validation Error', message: 'Invalid signature' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        if (userId && session.customer) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionTier: 'commercial',
              subscriptionStatus: 'active',
              subscriptionStartDate: new Date(),
              stripeCustomerId: String(session.customer),
              stripeSubscriptionId: session.subscription ? String(session.subscription) : null,
            },
          });
          logger.info(`Stripe checkout completed for user ${userId} — upgraded to commercial`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({ where: { stripeCustomerId: String(subscription.customer) } });
        if (user) {
          const cancelling = subscription.cancel_at_period_end;
          const active = subscription.status === 'active' || subscription.status === 'trialing';
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: active ? (cancelling ? 'cancelled' : 'active') : 'expired',
              stripeSubscriptionId: subscription.id,
            },
          });
          logger.info(`Stripe subscription updated for user ${user.id}: status=${subscription.status} cancelAtPeriodEnd=${cancelling}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({ where: { stripeCustomerId: String(subscription.customer) } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionTier: 'student', subscriptionStatus: 'cancelled' },
          });
          logger.info(`Stripe subscription deleted for user ${user.id} — reverted to student`);
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook handling error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
}
