import { slackWebhookUrl, signupSlackMessage } from '../signupNotice';

describe('slackWebhookUrl', () => {
  it('is off unless a Slack webhook URL is set', () => {
    expect(slackWebhookUrl({})).toBeNull();
    expect(slackWebhookUrl({ SLACK_SIGNUP_WEBHOOK_URL: 'https://example.com/x' })).toBeNull();
  });

  it('accepts a Slack incoming-webhook URL', () => {
    const url = 'https://hooks.slack.com/services/T000/B000/XXXX';
    expect(slackWebhookUrl({ SLACK_SIGNUP_WEBHOOK_URL: ` ${url} ` })).toBe(url);
  });
});

describe('signupSlackMessage', () => {
  it('names the product, the method, the person and the email', () => {
    const m = signupSlackMessage({ product: 'ailean', name: 'Mette Hansen', email: 'mette@firma.dk', method: 'google' });
    expect(m.text).toBe('New sign-up on Ailean (Google): Mette Hansen, mette@firma.dk');
  });

  it('copes without a name and escapes Slack control characters', () => {
    const m = signupSlackMessage({ product: 'vimpl', name: '<!channel> & co', email: 'x@y.dk', method: 'email' });
    expect(m.text).toBe('New sign-up on vimpl (email): &lt;!channel&gt; &amp; co, x@y.dk');
    expect(signupSlackMessage({ product: 'vimpl', name: '', email: 'x@y.dk', method: 'email' }).text)
      .toBe('New sign-up on vimpl (email): x@y.dk');
  });
});
