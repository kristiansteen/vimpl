// WhatsApp message to the founder when someone signs up, through Meta's WhatsApp Cloud API.
// Off unless WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_NOTIFY_TO are set.
// Messages a business starts must use an approved template; ours has three body parameters:
// {{1}} product and sign-up method, {{2}} name, {{3}} email.
import logger from '../utils/logger';

const GRAPH = 'https://graph.facebook.com/v21.0';

export interface WhatsAppConfig { token: string; phoneNumberId: string; to: string; template: string; language: string }
export interface SignupNotice { product: 'ailean' | 'vimpl'; name: string; email: string; method: 'email' | 'google' }

export function whatsAppConfig(env: Record<string, string | undefined> = process.env): WhatsAppConfig | null {
  const token = env.WHATSAPP_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const to = env.WHATSAPP_NOTIFY_TO?.replace(/\D/g, '');
  if (!token || !phoneNumberId || !to) return null;
  return {
    token, phoneNumberId, to,
    template: env.WHATSAPP_TEMPLATE?.trim() || 'new_signup',
    language: env.WHATSAPP_TEMPLATE_LANG?.trim() || 'en',
  };
}

const param = (text: string) => ({ type: 'text', text: text.trim() || '–' });

export function signupNoticeRequest(cfg: WhatsAppConfig, n: SignupNotice) {
  const product = n.product === 'ailean' ? 'Ailean' : 'vimpl';
  const method = n.method === 'google' ? 'Google' : 'email';
  return {
    url: `${GRAPH}/${cfg.phoneNumberId}/messages`,
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: {
      messaging_product: 'whatsapp',
      to: cfg.to,
      type: 'template',
      template: {
        name: cfg.template,
        language: { code: cfg.language },
        components: [{ type: 'body', parameters: [param(`${product} (${method})`), param(n.name), param(n.email)] }],
      },
    },
  };
}

/** Sends the notice. Never throws: a failed WhatsApp message must not affect the sign-up. */
export async function notifySignup(n: SignupNotice): Promise<boolean> {
  const cfg = whatsAppConfig();
  if (!cfg) return false;
  const r = signupNoticeRequest(cfg, n);
  try {
    const res = await fetch(r.url, { method: 'POST', headers: r.headers, body: JSON.stringify(r.body), signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      logger.error(`WhatsApp sign-up notice failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.error('WhatsApp sign-up notice error:', err);
    return false;
  }
}
