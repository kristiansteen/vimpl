import { onboardingEmail, AILEAN_APP_URL } from '../onboarding.templates';
import { ONBOARDING_DAYS } from '../onboarding.policy';

const base = { name: 'Mette', unsubscribeUrl: 'https://api.example/unsub?u=1&t=abc' };

describe('onboardingEmail — Ailean', () => {
  it('has its own subject for every day in both languages', () => {
    for (const lang of ['en', 'da'] as const) {
      const subjects = ONBOARDING_DAYS.map(day => onboardingEmail({ ...base, product: 'ailean', lang, day }).subject);
      expect(new Set(subjects).size).toBe(ONBOARDING_DAYS.length);
      subjects.forEach(s => expect(s).not.toMatch(/vimpl/i));
    }
  });

  it('greets by name, links to the Ailean app and carries the unsubscribe link in html and text', () => {
    const e = onboardingEmail({ ...base, product: 'ailean', lang: 'en', day: 0 });
    expect(e.html).toContain('Hi Mette');
    expect(e.html).toContain(AILEAN_APP_URL);
    expect(e.html).toContain('https://api.example/unsub?u=1&amp;t=abc');
    expect(e.text).toContain('https://api.example/unsub?u=1&t=abc');
    expect(e.text).toContain(AILEAN_APP_URL);
    expect(e.from).toMatch(/Ailean/);
  });

  it('sends replies to a real inbox', () => {
    expect(onboardingEmail({ ...base, product: 'ailean', lang: 'en', day: 7 }).replyTo).toBe('ailean@vimpl.com');
    expect(onboardingEmail({ ...base, product: 'vimpl', lang: 'en', day: 7 }).replyTo).toBe('ailean@vimpl.com');
  });

  it('writes Danish when asked', () => {
    const e = onboardingEmail({ ...base, product: 'ailean', lang: 'da', day: 0 });
    expect(e.html).toContain('Hej Mette');
    expect(e.html).toContain('Afmeld');
  });

  it('escapes the name', () => {
    const e = onboardingEmail({ ...base, name: '<b>x</b>', product: 'ailean', lang: 'en', day: 1 });
    expect(e.html).not.toContain('<b>x</b>');
    expect(e.html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });

  it('falls back to a neutral greeting without a name', () => {
    expect(onboardingEmail({ ...base, name: '', product: 'ailean', lang: 'en', day: 2 }).html).toContain('Hi there');
  });
});

describe('onboardingEmail — vimpl', () => {
  it('keeps vimpl branding and adds the unsubscribe link', () => {
    const e = onboardingEmail({ ...base, product: 'vimpl', lang: 'en', day: 3 });
    expect(e.subject).toMatch(/vimpl/);
    expect(e.html).toContain('https://app.vimpl.com');
    expect(e.html).toContain('unsub');
    expect(e.from).toMatch(/vimpl/);
  });
});
