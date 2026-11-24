import { whatsAppConfig, signupNoticeRequest } from '../whatsapp';

describe('whatsAppConfig', () => {
  it('is off unless token, phone number id and recipient are all set', () => {
    expect(whatsAppConfig({})).toBeNull();
    expect(whatsAppConfig({ WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '1' })).toBeNull();
  });

  it('reads the settings and cleans the recipient number', () => {
    expect(whatsAppConfig({ WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '123', WHATSAPP_NOTIFY_TO: '+45 12 34 56 78' })).toEqual({
      token: 't', phoneNumberId: '123', to: '4512345678', template: 'new_signup', language: 'en',
    });
  });

  it('allows another template name and language', () => {
    const c = whatsAppConfig({ WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '1', WHATSAPP_NOTIFY_TO: '45', WHATSAPP_TEMPLATE: 'ny_bruger', WHATSAPP_TEMPLATE_LANG: 'da' });
    expect(c?.template).toBe('ny_bruger');
    expect(c?.language).toBe('da');
  });
});

describe('signupNoticeRequest', () => {
  const cfg = { token: 'tok', phoneNumberId: '123', to: '4512345678', template: 'new_signup', language: 'en' };

  it('posts a template message with product, name and email as the three parameters', () => {
    const r = signupNoticeRequest(cfg, { product: 'ailean', name: 'Mette Hansen', email: 'mette@firma.dk', method: 'google' });
    expect(r.url).toBe('https://graph.facebook.com/v21.0/123/messages');
    expect(r.headers.Authorization).toBe('Bearer tok');
    expect(r.body).toEqual({
      messaging_product: 'whatsapp',
      to: '4512345678',
      type: 'template',
      template: {
        name: 'new_signup',
        language: { code: 'en' },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: 'Ailean (Google)' },
            { type: 'text', text: 'Mette Hansen' },
            { type: 'text', text: 'mette@firma.dk' },
          ],
        }],
      },
    });
  });

  it('never sends an empty parameter (WhatsApp rejects those)', () => {
    const r = signupNoticeRequest(cfg, { product: 'vimpl', name: '', email: 'x@y.dk', method: 'email' });
    expect(r.body.template.components[0].parameters.map((p: { text: string }) => p.text)).toEqual(['vimpl (email)', '–', 'x@y.dk']);
  });
});
