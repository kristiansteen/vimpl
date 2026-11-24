import {
  newInviteToken, canStartRound, validateRoundInput, validateContribution,
  canContribute, invitationView, ownerRoundView, roundSummary, nextSubmission,
} from '../round.policy';

const round = {
  id: 'r1', ownerId: 'u-owner', processName: 'Invoice approval', startTrigger: 'Invoice received',
  endPoint: 'Invoice paid', language: 'en', inviteToken: 'secret-token', status: 'open' as const,
  draft: null, flowId: null, createdAt: new Date('2026-11-15'), updatedAt: new Date('2026-11-15'),
};
const sub = (over: Record<string, unknown> = {}) => ({
  id: 's1', roundId: 'r1', userId: 'u-anna', status: 'submitted' as const,
  contribution: { transcript: 'hello', description: { steps: [] } },
  submittedAt: new Date('2026-11-15'), createdAt: new Date('2026-11-15'), updatedAt: new Date('2026-11-15'),
  ...over,
});

describe('canStartRound', () => {
  it('allows paid plans and admins only', () => {
    expect(canStartRound({ subscriptionTier: 'commercial', isAdmin: false })).toBe(true);
    expect(canStartRound({ subscriptionTier: 'enterprise', isAdmin: false })).toBe(true);
    expect(canStartRound({ subscriptionTier: 'student', isAdmin: false })).toBe(false);
    expect(canStartRound({ subscriptionTier: null, isAdmin: false })).toBe(false);
    expect(canStartRound({ subscriptionTier: 'student', isAdmin: true })).toBe(true);
  });
});

describe('validateRoundInput', () => {
  const ok = { processName: '  Invoice approval  ', startTrigger: 'Invoice received', endPoint: 'Invoice paid' };
  it('requires the end point', () => {
    expect(validateRoundInput({ ...ok, endPoint: '' }).ok).toBe(false);
    expect(validateRoundInput({ processName: 'x', startTrigger: 'y' }).ok).toBe(false);
  });
  it('trims and defaults the language', () => {
    const r = validateRoundInput(ok);
    expect(r.ok && r.value).toEqual({ processName: 'Invoice approval', startTrigger: 'Invoice received', endPoint: 'Invoice paid', language: 'en' });
  });
  it('rejects a name over 200 characters', () => {
    expect(validateRoundInput({ ...ok, processName: 'x'.repeat(201) }).ok).toBe(false);
  });
  it('falls back to English for an unknown language', () => {
    const r = validateRoundInput({ ...ok, language: 'de' });
    expect(r.ok && r.value.language).toBe('en');
    const d = validateRoundInput({ ...ok, language: 'da' });
    expect(d.ok && d.value.language).toBe('da');
  });
  it('rejects a non-object body', () => {
    expect(validateRoundInput(null).ok).toBe(false);
  });
});

describe('validateContribution', () => {
  it('requires transcript and description to submit', () => {
    expect(validateContribution({ status: 'submitted', contribution: { transcript: 'x' } }).ok).toBe(false);
    expect(validateContribution({ status: 'submitted', contribution: { transcript: 'x', description: {} } }).ok).toBe(true);
  });
  it('accepts an empty contribution when opened', () => {
    expect(validateContribution({ status: 'opened', contribution: {} }).ok).toBe(true);
  });
  it('accepts a very long transcript', () => {
    expect(validateContribution({ status: 'started', contribution: { transcript: 'x'.repeat(200_000) } }).ok).toBe(true);
  });
  it('rejects a transcript that is not text, and an unknown status', () => {
    expect(validateContribution({ status: 'started', contribution: { transcript: 42 } }).ok).toBe(false);
    expect(validateContribution({ status: 'done', contribution: {} }).ok).toBe(false);
  });
});

describe('canContribute', () => {
  it('is only possible while the round is open', () => {
    expect(canContribute({ status: 'open' })).toBe(true);
    expect(canContribute({ status: 'closed' })).toBe(false);
    expect(canContribute({ status: 'promoted' })).toBe(false);
  });
});

describe('invitationView', () => {
  const owner = { name: 'Kristian', email: 'k@x.dk' };
  it('never exposes the invite token or the owner id', () => {
    const v = invitationView(round, owner, null) as Record<string, unknown>;
    expect(v.inviteToken).toBeUndefined();
    expect(v.ownerId).toBeUndefined();
    expect(v.submissions).toBeUndefined();
    expect(v.ownSubmission).toBeNull();
    expect(v.ownerName).toBe('Kristian');
  });
  it('falls back to the owner email when there is no name', () => {
    expect(invitationView(round, { name: null, email: 'k@x.dk' }, null).ownerName).toBe('k@x.dk');
  });
  it('includes the caller\'s own submission only', () => {
    const v = invitationView(round, owner, sub());
    expect(v.ownSubmission).toEqual({ status: 'submitted', contribution: sub().contribution, submittedAt: sub().submittedAt });
  });
});

describe('ownerRoundView', () => {
  it('lists each participant with name and email', () => {
    const v = ownerRoundView(round, [{ ...sub(), user: { name: 'Anna Holm', email: 'anna@x.dk' } }]);
    expect(v.inviteToken).toBe('secret-token');
    expect(v.submissions[0]).toMatchObject({ id: 's1', status: 'submitted', participantName: 'Anna Holm', participantEmail: 'anna@x.dk' });
  });
});

describe('roundSummary', () => {
  it('carries the counts and no submission data', () => {
    const v = roundSummary(round, { opened: 1, started: 2, submitted: 3 }) as Record<string, unknown>;
    expect(v.counts).toEqual({ opened: 1, started: 2, submitted: 3 });
    expect(v.submissions).toBeUndefined();
  });

  it('says which flow the round belongs to', () => {
    expect((roundSummary({ ...round, flowId: 'f1' }, { opened: 0, started: 0, submitted: 0 }) as Record<string, unknown>).flowId).toBe('f1');
  });
});

describe('newInviteToken', () => {
  it('is long and unique', () => {
    const a = newInviteToken(), b = newInviteToken();
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('nextSubmission', () => {
  const submitted = { status: 'submitted', contribution: { transcript: 'old', description: { steps: [1] } }, submittedAt: new Date('2026-11-14') };
  it('a draft save never replaces a submitted version', () => {
    expect(nextSubmission(submitted, { status: 'started', contribution: { transcript: 'new' } })).toBeNull();
    expect(nextSubmission(submitted, { status: 'opened', contribution: {} })).toBeNull();
  });
  it('a new submit replaces the submitted version', () => {
    const r = nextSubmission(submitted, { status: 'submitted', contribution: { transcript: 'new', description: {} } });
    expect(r).toMatchObject({ status: 'submitted', contribution: { transcript: 'new', description: {} } });
    expect(r!.submittedAt).toBeInstanceOf(Date);
  });
  it('drafts are saved while nothing has been submitted', () => {
    expect(nextSubmission(null, { status: 'opened', contribution: {} })).toEqual({ status: 'opened', contribution: {}, submittedAt: null });
    expect(nextSubmission({ ...submitted, status: 'started', submittedAt: null }, { status: 'started', contribution: { transcript: 'x' } }))
      .toEqual({ status: 'started', contribution: { transcript: 'x' }, submittedAt: null });
  });
});
