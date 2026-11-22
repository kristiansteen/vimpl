// Rules for inviting people by email to describe a flow's process.
// Pure functions, no database access, so every rule can be unit tested.

export const MAX_INVITES_PER_ROUND = 50;
export const MAX_NOTE = 500;
const REMIND_AFTER_MS = 24 * 60 * 60 * 1000;
const MAX_TEXT = 200;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export type InviteStatus = 'invited' | 'opened' | 'started' | 'submitted';

const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[a-z]{2,}$/i;
const RANK: Record<string, number> = { opened: 1, started: 2, submitted: 3 };

/** Emails from free text or a list: "a@b.dk, c@d.dk", one per line, or "Name <a@b.dk>". */
export function parseEmails(input: unknown): { valid: string[]; invalid: string[] } {
  const parts: string[] = Array.isArray(input)
    ? input.filter((x): x is string => typeof x === 'string')
    : typeof input === 'string'
      ? input.replace(/[^<>]*<([^>]+)>/g, ' $1 ').split(/[\s,;]+/)
      : [];
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const raw of parts) {
    const p = raw.trim().replace(/^<|>$/g, '');
    if (!p) continue;
    if (EMAIL.test(p)) {
      const e = p.toLowerCase();
      if (!valid.includes(e)) valid.push(e);
    } else if (!invalid.includes(p)) {
      invalid.push(p);
    }
  }
  return { valid, invalid };
}

interface InviteRow { id: string; email: string; lastSentAt: Date }
interface SubmissionRow { status: string; user: { email: string; name: string | null } }

/** Each invitee with their progress, read from the submission made with the same email. */
export function inviteStatuses<T extends InviteRow>(invites: T[], submissions: SubmissionRow[]) {
  const byEmail = new Map<string, SubmissionRow>();
  for (const s of submissions) {
    const key = s.user.email.trim().toLowerCase();
    const prev = byEmail.get(key);
    if (!prev || (RANK[s.status] || 0) > (RANK[prev.status] || 0)) byEmail.set(key, s);
  }
  return invites.map(i => {
    const s = byEmail.get(i.email.toLowerCase());
    return { ...i, status: (s && RANK[s.status] ? s.status : 'invited') as InviteStatus, name: s?.user.name ?? null };
  });
}

/** Not yet submitted, and the last email went out at least a day ago. */
export function canRemind(invite: { status: string; lastSentAt: Date }, now: Date): boolean {
  return invite.status !== 'submitted' && now.getTime() - new Date(invite.lastSentAt).getTime() >= REMIND_AFTER_MS;
}

export function validateNote(note: unknown): Result<string> {
  if (note === undefined || note === null) return { ok: true, value: '' };
  if (typeof note !== 'string') return { ok: false, error: 'note must be text' };
  const t = note.trim();
  return t.length <= MAX_NOTE ? { ok: true, value: t } : { ok: false, error: `note is too long (max ${MAX_NOTE} characters)` };
}

function text(v: unknown, required: boolean): string | null {
  if (v === undefined || v === null || v === '') return required ? null : '';
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return required ? null : '';
  return t.length <= MAX_TEXT ? t : null;
}

/** A round started from a flow: the flow and its name are needed; start and end may not be known yet. */
export function validateFlowRoundInput(body: unknown): Result<{
  flowId: string; processName: string; startTrigger: string; endPoint: string; language: 'en' | 'da';
}> {
  const b = (body && typeof body === 'object' && !Array.isArray(body) ? body : {}) as Record<string, unknown>;
  const flowId = typeof b.flowId === 'string' && b.flowId.trim() ? b.flowId.trim() : null;
  if (!flowId) return { ok: false, error: 'flowId is required' };
  const processName = text(b.processName, true);
  if (!processName) return { ok: false, error: `processName is required (max ${MAX_TEXT} characters)` };
  const startTrigger = text(b.startTrigger, false);
  const endPoint = text(b.endPoint, false);
  if (startTrigger === null || endPoint === null) return { ok: false, error: `start and end are text (max ${MAX_TEXT} characters)` };
  return { ok: true, value: { flowId, processName, startTrigger, endPoint, language: b.language === 'da' ? 'da' : 'en' } };
}
