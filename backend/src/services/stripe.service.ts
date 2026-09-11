import Stripe from 'stripe';
import config from '../config';
import logger from '../utils/logger';

let stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!config.stripe.secretKey) return null;
  if (!stripe) stripe = new Stripe(config.stripe.secretKey);
  return stripe;
}

export function isStripeConfigured(): boolean {
  return !!(config.stripe.secretKey && config.stripe.priceCommercial);
}

interface CheckoutParams {
  userId: string;
  email: string;
  stripeCustomerId: string | null;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Commercial is the only self-serve plan — Enterprise stays "Let's talk"
 * (contact sales), so there's only ever one price to check out.
 */
export async function createCommercialCheckoutSession(params: CheckoutParams): Promise<string> {
  const client = getStripe();
  if (!client) throw new Error('Stripe is not configured');

  const session = await client.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: config.stripe.priceCommercial, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.userId,
    customer: params.stripeCustomerId || undefined,
    customer_email: params.stripeCustomerId ? undefined : params.email,
    metadata: { userId: params.userId, tier: 'commercial' },
    subscription_data: { metadata: { userId: params.userId, tier: 'commercial' } },
  });

  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return session.url;
}

export async function createPortalSession(stripeCustomerId: string, returnUrl: string): Promise<string> {
  const client = getStripe();
  if (!client) throw new Error('Stripe is not configured');

  const session = await client.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
  const client = getStripe();
  if (!client) throw new Error('Stripe is not configured');
  if (!config.stripe.webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  return client.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}

export function logStripeConfigWarningOnce(): void {
  if (!isStripeConfigured()) {
    logger.warn('Stripe not fully configured — billing endpoints will return 503 until STRIPE_SECRET_KEY and STRIPE_PRICE_COMMERCIAL are set');
  }
}
