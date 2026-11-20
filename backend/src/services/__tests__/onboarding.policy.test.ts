import {
  dueMilestone,
  signupSourceFromState,
  productFor,
  unsubscribeToken,
  verifyUnsubscribeToken,
  langFor,
} from '../onboarding.policy';

const DAY = 24 * 60 * 60 * 1000;
const signup = new Date('2026-11-01T10:00:00Z');
const at = (days: number) => new Date(signup.getTime() + days * DAY);

describe('dueMilestone', () => {
  it('sends the welcome on the day of sign-up if it has not gone out', () => {
    expect(dueMilestone(signup, [], at(0.9))).toBe(0);
  });

  it('sends nothing once the welcome has gone out and day 1 is not reached', () => {
    expect(dueMilestone(signup, [0], at(0.9))).toBeNull();
  });

  it('sends each milestone inside its window', () => {
    expect(dueMilestone(signup, [0], at(1.5))).toBe(1);
    expect(dueMilestone(signup, [0, 1], at(2.2))).toBe(2);
    expect(dueMilestone(signup, [0, 1, 2], at(4.9))).toBe(3);
    expect(dueMilestone(signup, [0, 1, 2, 3], at(6.1))).toBe(5);
    expect(dueMilestone(signup, [0, 1, 2, 3, 5], at(8.5))).toBe(7);
  });

  it('still sends a milestone when a daily run was missed inside its window', () => {
    // Day 3's window runs until day 5, so a run on day 4.5 catches it.
    expect(dueMilestone(signup, [0, 1, 2], at(4.5))).toBe(3);
  });

  it('never sends an older milestone once the next one is due (no backlog of emails)', () => {
    expect(dueMilestone(signup, [0], at(3.2))).toBe(3);
  });

  it('stops after day 7 and does not reach old accounts', () => {
    expect(dueMilestone(signup, [0, 1, 2, 3, 5], at(9.1))).toBeNull();
    expect(dueMilestone(signup, [], at(40))).toBeNull();
  });

  it('does nothing for a sign-up date in the future', () => {
    expect(dueMilestone(signup, [], at(-0.5))).toBeNull();
  });
});

describe('signupSourceFromState', () => {
  const enc = (o: unknown) => encodeURIComponent(Buffer.from(JSON.stringify(o)).toString('base64'));

  it('recognises the Ailean app', () => {
    expect(signupSourceFromState(enc({ origin: 'https://x.app', source: 'voice2launch' }))).toBe('ailean');
    expect(signupSourceFromState(enc({ origin: 'https://x.app', source: 'ailean' }))).toBe('ailean');
  });

  it('returns null for anything else or garbage', () => {
    expect(signupSourceFromState(enc({ origin: 'https://vimpl.com' }))).toBeNull();
    expect(signupSourceFromState('not-base64-json')).toBeNull();
    expect(signupSourceFromState(undefined)).toBeNull();
  });
});

describe('productFor', () => {
  it('uses the stored sign-up source first', () => {
    expect(productFor({ signupSource: 'ailean' }, false)).toBe('ailean');
    expect(productFor({ signupSource: 'vimpl' }, true)).toBe('vimpl');
  });

  it('falls back to Ailean when the user has Ailean data, otherwise vimpl', () => {
    expect(productFor({}, true)).toBe('ailean');
    expect(productFor(null, false)).toBe('vimpl');
  });
});

describe('langFor', () => {
  it('uses the saved Ailean language, else English', () => {
    expect(langFor({ preferredLang: 'da' })).toBe('da');
    expect(langFor({ preferredLang: 'fr' })).toBe('en');
    expect(langFor(null)).toBe('en');
  });
});

describe('unsubscribe tokens', () => {
  it('verifies a token made for the same user and secret only', () => {
    const t = unsubscribeToken('user-1', 's3cret');
    expect(verifyUnsubscribeToken('user-1', t, 's3cret')).toBe(true);
    expect(verifyUnsubscribeToken('user-2', t, 's3cret')).toBe(false);
    expect(verifyUnsubscribeToken('user-1', t, 'other')).toBe(false);
    expect(verifyUnsubscribeToken('user-1', '', 's3cret')).toBe(false);
    expect(verifyUnsubscribeToken('user-1', t.slice(0, -2), 's3cret')).toBe(false);
  });
});
