import {
  parseEmails, inviteStatuses, canRemind, validateNote, validateFlowRoundInput, MAX_INVITES_PER_ROUND,
} from '../invite.policy';

const HOUR = 60 * 60 * 1000;

describe('parseEmails', () => {
  it('splits on commas, semicolons, spaces and new lines, lower-cases and removes duplicates', () => {
    expect(parseEmails('Mette@Firma.dk, jonas@firma.dk;\nlars@firma.dk  mette@firma.dk')).toEqual({
      valid: ['mette@firma.dk', 'jonas@firma.dk', 'lars@firma.dk'],
      invalid: [],
    });
  });

  it('accepts a list and reports what is not an email', () => {
    expect(parseEmails(['a@b.dk', 'not-an-email', 'x@y'])).toEqual({ valid: ['a@b.dk'], invalid: ['not-an-email', 'x@y'] });
  });

  it('accepts "Name <email>" as copied from a mail client', () => {
    expect(parseEmails('Mette Hansen <mette@firma.dk>').valid).toEqual(['mette@firma.dk']);
  });

  it('gives nothing for empty or wrong input', () => {
    expect(parseEmails('')).toEqual({ valid: [], invalid: [] });
    expect(parseEmails(42)).toEqual({ valid: [], invalid: [] });
  });
});

describe('inviteStatuses', () => {
  const invites = [
    { id: 'i1', email: 'mette@firma.dk', lastSentAt: new Date() },
    { id: 'i2', email: 'jonas@firma.dk', lastSentAt: new Date() },
    { id: 'i3', email: 'lars@firma.dk', lastSentAt: new Date() },
  ];
  const subs = [
    { status: 'submitted', user: { email: 'Mette@firma.dk', name: 'Mette' } },
    { status: 'started', user: { email: 'jonas@firma.dk', name: 'Jonas' } },
  ];

  it('takes each invitee status from their submission, matched on email', () => {
    expect(inviteStatuses(invites, subs).map(i => [i.email, i.status, i.name])).toEqual([
      ['mette@firma.dk', 'submitted', 'Mette'],
      ['jonas@firma.dk', 'started', 'Jonas'],
      ['lars@firma.dk', 'invited', null],
    ]);
  });
});

describe('canRemind', () => {
  const now = new Date('2026-11-22T12:00:00Z');
  const ago = (h: number) => new Date(now.getTime() - h * HOUR);

  it('reminds people who have not submitted, once a day at most', () => {
    expect(canRemind({ status: 'invited', lastSentAt: ago(25) }, now)).toBe(true);
    expect(canRemind({ status: 'started', lastSentAt: ago(30) }, now)).toBe(true);
    expect(canRemind({ status: 'invited', lastSentAt: ago(23) }, now)).toBe(false);
    expect(canRemind({ status: 'submitted', lastSentAt: ago(48) }, now)).toBe(false);
  });
});

describe('validateNote', () => {
  it('trims, allows none and caps the length', () => {
    expect(validateNote(undefined)).toEqual({ ok: true, value: '' });
    expect(validateNote('  Thanks!  ')).toEqual({ ok: true, value: 'Thanks!' });
    expect(validateNote('x'.repeat(501)).ok).toBe(false);
    expect(validateNote(7).ok).toBe(false);
  });
});

describe('validateFlowRoundInput', () => {
  it('needs a flow and a process name; start and end may be empty', () => {
    expect(validateFlowRoundInput({ flowId: 'f1', processName: ' Purchase request ' })).toEqual({
      ok: true, value: { flowId: 'f1', processName: 'Purchase request', startTrigger: '', endPoint: '', language: 'en' },
    });
    expect(validateFlowRoundInput({ processName: 'x' }).ok).toBe(false);
    expect(validateFlowRoundInput({ flowId: 'f1' }).ok).toBe(false);
  });

  it('keeps start, end and Danish when given', () => {
    const r = validateFlowRoundInput({ flowId: 'f1', processName: 'Indkøb', startTrigger: 'Behov', endPoint: 'Ordre', language: 'da' });
    expect(r.ok && r.value).toEqual({ flowId: 'f1', processName: 'Indkøb', startTrigger: 'Behov', endPoint: 'Ordre', language: 'da' });
  });
});

it('caps invitations per round', () => {
  expect(MAX_INVITES_PER_ROUND).toBe(50);
});
