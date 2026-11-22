import { inviteEmail } from '../invite.templates';

const base = {
  ownerName: 'Kristian Steen',
  ownerEmail: 'kristian@firma.dk',
  processName: 'Purchase request',
  startTrigger: 'Need registered',
  endPoint: 'Order sent',
  note: '',
  link: 'https://voice-2-launch.vercel.app/?round=abc',
};

describe('inviteEmail', () => {
  it('comes from the owner via Ailean and replies go to the owner', () => {
    const e = inviteEmail({ ...base, lang: 'en', kind: 'invite' });
    expect(e.from).toBe('Kristian Steen via Ailean <ailean@onboard.vimpl.com>');
    expect(e.replyTo).toBe('kristian@firma.dk');
    expect(e.subject).toBe('Kristian Steen asked you to describe: Purchase request');
  });

  it('carries the link, the scope and the owner in html and text', () => {
    const e = inviteEmail({ ...base, lang: 'en', kind: 'invite' });
    for (const body of [e.html, e.text]) {
      expect(body).toContain('https://voice-2-launch.vercel.app/?round=abc');
      expect(body).toContain('Need registered');
      expect(body).toContain('Order sent');
    }
    expect(e.html).toContain('only shared with Kristian Steen');
  });

  it('leaves the scope out when start and end are not known', () => {
    const e = inviteEmail({ ...base, startTrigger: '', endPoint: '', lang: 'en', kind: 'invite' });
    expect(e.text).not.toContain('From:');
  });

  it('quotes the note, escaped', () => {
    const e = inviteEmail({ ...base, note: 'Thanks <3', lang: 'en', kind: 'invite' });
    expect(e.html).toContain('Thanks &lt;3');
    expect(e.text).toContain('Thanks <3');
  });

  it('has a reminder and a Danish version', () => {
    expect(inviteEmail({ ...base, lang: 'en', kind: 'reminder' }).subject).toBe('Reminder: describe Purchase request for Kristian Steen');
    const da = inviteEmail({ ...base, lang: 'da', kind: 'invite' });
    expect(da.subject).toBe('Kristian Steen har bedt dig beskrive: Purchase request');
    expect(da.html).toContain('Beskriv processen');
  });

  it('keeps the sender name safe and falls back to the email', () => {
    expect(inviteEmail({ ...base, ownerName: 'Eve "<x>"', lang: 'en', kind: 'invite' }).from).toBe('Eve x via Ailean <ailean@onboard.vimpl.com>');
    expect(inviteEmail({ ...base, ownerName: '', lang: 'en', kind: 'invite' }).subject).toContain('kristian@firma.dk');
  });
});
