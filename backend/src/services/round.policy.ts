// Access rules and response shapes for AS-IS rounds (voice-2-launch).
// Pure functions, no database access, so every rule can be unit tested.
// A round: a process owner invites several people to describe the same process.

import crypto from 'crypto';

export type RoundStatus = 'open' | 'closed' | 'promoted';
export type SubmissionStatus = 'opened' | 'started' | 'submitted';

export interface Contribution {
  transcript?: string;
  description?: object;
  parsed?: object;
  metrics?: object;
}

export interface Round {
  id: string;
  ownerId: string;
  processName: string;
  startTrigger: string;
  endPoint: string;
  language: string;
  inviteToken: string;
  status: string;
  draft: unknown;
  flowId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Submission {
  id: string;
  roundId: string;
  userId: string;
  status: string;
  contribution: unknown;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Person { name: string | null; email: string }

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const PAID_TIERS = ['commercial', 'enterprise'];
const SUBMISSION_STATUSES: SubmissionStatus[] = ['opened', 'started', 'submitted'];
const MAX_TEXT = 200;

/** Unguessable link token: 32 random bytes, base64url (43 characters). */
export function newInviteToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** Only paid plans start rounds; otherwise a free account could run unlimited interviews by inviting itself. */
export function canStartRound(user: { subscriptionTier: string | null; isAdmin: boolean }): boolean {
  return user.isAdmin || PAID_TIERS.includes(user.subscriptionTier ?? '');
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function text(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length >= 1 && t.length <= MAX_TEXT ? t : null;
}

export function validateRoundInput(body: unknown): Result<{
  processName: string; startTrigger: string; endPoint: string; language: 'en' | 'da';
}> {
  if (!isObject(body)) return { ok: false, error: 'Body must be an object' };
  const processName = text(body.processName);
  const startTrigger = text(body.startTrigger);
  const endPoint = text(body.endPoint);
  if (!processName) return { ok: false, error: `processName is required (max ${MAX_TEXT} characters)` };
  if (!startTrigger) return { ok: false, error: `startTrigger is required (max ${MAX_TEXT} characters)` };
  if (!endPoint) return { ok: false, error: `endPoint is required (max ${MAX_TEXT} characters)` };
  const language = body.language === 'da' ? 'da' : 'en';
  return { ok: true, value: { processName, startTrigger, endPoint, language } };
}

export function validateContribution(body: unknown): Result<{ status: SubmissionStatus; contribution: Contribution }> {
  if (!isObject(body)) return { ok: false, error: 'Body must be an object' };
  const status = body.status as SubmissionStatus;
  if (!SUBMISSION_STATUSES.includes(status)) return { ok: false, error: `status must be one of ${SUBMISSION_STATUSES.join(', ')}` };
  const c = body.contribution ?? {};
  if (!isObject(c)) return { ok: false, error: 'contribution must be an object' };
  if (c.transcript !== undefined && typeof c.transcript !== 'string') return { ok: false, error: 'transcript must be text' };
  for (const key of ['description', 'parsed', 'metrics'] as const) {
    if (c[key] !== undefined && c[key] !== null && !isObject(c[key])) return { ok: false, error: `${key} must be an object` };
  }
  if (status === 'submitted' && (!c.transcript || !c.description)) {
    return { ok: false, error: 'A submitted contribution needs a transcript and a description' };
  }
  const contribution: Contribution = {};
  if (c.transcript !== undefined) contribution.transcript = c.transcript as string;
  if (c.description) contribution.description = c.description as object;
  if (c.parsed) contribution.parsed = c.parsed as object;
  if (c.metrics) contribution.metrics = c.metrics as object;
  return { ok: true, value: { status, contribution } };
}

/**
 * What to write for a save. A submitted version stands until a new submit replaces it:
 * a draft save ("opened", "started") after submitting returns null and changes nothing,
 * so "Change my answer" followed by closing the tab keeps the submitted version.
 */
export function nextSubmission(
  existing: { status: string; submittedAt?: Date | null } | null,
  incoming: { status: SubmissionStatus; contribution: Contribution },
): { status: SubmissionStatus; contribution: Contribution; submittedAt: Date | null } | null {
  if (existing?.status === 'submitted' && incoming.status !== 'submitted') return null;
  return {
    status: incoming.status,
    contribution: incoming.contribution,
    submittedAt: incoming.status === 'submitted' ? new Date() : null,
  };
}

/** Closed and promoted rounds accept nothing. The owner may contribute like anyone else. */
export function canContribute(round: { status: string }): boolean {
  return round.status === 'open';
}

/** What a participant sees: the scope and their own submission. Never the token, the owner's id or anyone else's input. */
export function invitationView(round: Round, owner: Person, own: Submission | null) {
  return {
    id: round.id,
    processName: round.processName,
    startTrigger: round.startTrigger,
    endPoint: round.endPoint,
    language: round.language,
    status: round.status,
    ownerName: owner.name || owner.email,
    ownSubmission: own
      ? { status: own.status, contribution: own.contribution, submittedAt: own.submittedAt }
      : null,
  };
}

/** What the owner sees: everything, including each participant by name. */
export function ownerRoundView(round: Round, submissions: Array<Submission & { user: Person }>) {
  return {
    id: round.id,
    processName: round.processName,
    startTrigger: round.startTrigger,
    endPoint: round.endPoint,
    language: round.language,
    status: round.status,
    inviteToken: round.inviteToken,
    flowId: round.flowId,
    createdAt: round.createdAt,
    updatedAt: round.updatedAt,
    submissions: submissions.map(s => ({
      id: s.id,
      status: s.status,
      participantName: s.user.name,
      participantEmail: s.user.email,
      contribution: s.contribution,
      updatedAt: s.updatedAt,
      submittedAt: s.submittedAt,
    })),
  };
}

/** One line in the owner's list of rounds. */
export function roundSummary(round: Round, counts: { opened: number; started: number; submitted: number }) {
  return {
    id: round.id,
    processName: round.processName,
    status: round.status,
    language: round.language,
    createdAt: round.createdAt,
    updatedAt: round.updatedAt,
    counts,
  };
}
