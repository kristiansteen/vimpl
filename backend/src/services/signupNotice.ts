// Slack message to the founder when someone signs up, through a Slack incoming webhook.
// Off unless SLACK_SIGNUP_WEBHOOK_URL is set.
import logger from '../utils/logger';

export interface SignupNotice { product: 'ailean' | 'vimpl'; name: string; email: string; method: 'email' | 'google' }

export function slackWebhookUrl(env: Record<string, string | undefined> = process.env): string | null {
  const url = env.SLACK_SIGNUP_WEBHOOK_URL?.trim();
  return url && url.startsWith('https://hooks.slack.com/') ? url : null;
}

// Slack treats <, > and & as markup (links, @channel); show them as plain text.
const plain = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function signupSlackMessage(n: SignupNotice): { text: string } {
  const product = n.product === 'ailean' ? 'Ailean' : 'vimpl';
  const method = n.method === 'google' ? 'Google' : 'email';
  const who = [n.name.trim(), n.email.trim()].filter(Boolean).map(plain).join(', ');
  return { text: `New sign-up on ${product} (${method}): ${who}` };
}

/** Posts the notice. Never throws: a failed Slack message must not affect the sign-up. */
export async function notifySignup(n: SignupNotice): Promise<boolean> {
  const url = slackWebhookUrl();
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupSlackMessage(n)),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      logger.error(`Slack sign-up notice failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.error('Slack sign-up notice error:', err);
    return false;
  }
}
