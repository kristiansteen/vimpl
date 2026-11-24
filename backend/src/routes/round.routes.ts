// AS-IS rounds for voice-2-launch: a process owner invites several people to
// describe the same process. Access rules live in services/round.policy.ts.
//
// Owner:        POST /, GET /, GET /:id, POST /:id/close|reopen|renew-link
//               GET /by-flow/:flowId, POST /from-flow, POST /:id/link
//               POST /:id/invites, POST /:id/remind, DELETE /:id/invites/:inviteId
// Participant:  GET /invite/:token, PUT|DELETE /invite/:token/contribution
// Every route requires login. Participants never receive anyone else's input.

import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import logger from '../utils/logger';
import {
  newInviteToken, canStartRound, validateRoundInput, validateContribution,
  canContribute, invitationView, ownerRoundView, roundSummary, nextSubmission,
} from '../services/round.policy';
import {
  parseEmails, inviteStatuses, canRemind, validateNote, validateFlowRoundInput, MAX_INVITES_PER_ROUND,
} from '../services/invite.policy';
import { inviteEmail } from '../services/invite.templates';
import { AILEAN_APP_URL } from '../services/onboarding.templates';
import { sendEmail } from '../services/email.service';

const router = Router();
router.use(authenticate);

const withParticipants = {
  submissions: {
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

// Loads a round only if the caller owns it. Sends 404 otherwise (no hint that it exists).
async function ownedRound(req: AuthRequest, res: Response) {
  const round = await prisma.asIsRound.findUnique({ where: { id: req.params.id }, include: withParticipants });
  if (!round || round.ownerId !== req.user!.userId) {
    res.status(404).json({ error: 'Not Found' });
    return null;
  }
  return round;
}


// ── Invitations by email ──────────────────────────────────────────────

type OwnedRound = NonNullable<Awaited<ReturnType<typeof ownedRound>>>;

// The invite table is created by hand (prisma db push); until then rounds work without it.
async function loadInvites(roundId: string) {
  try {
    return await prisma.roundInvite.findMany({ where: { roundId }, orderBy: { createdAt: 'asc' } });
  } catch (error) {
    logger.warn('round_invites not available yet:', error);
    return [];
  }
}

async function ownerView(round: OwnedRound) {
  const invites = await loadInvites(round.id);
  const statuses = inviteStatuses(invites, round.submissions);
  return {
    ...ownerRoundView(round, round.submissions),
    invites: statuses.map(i => ({
      id: i.id, email: i.email, name: i.name, status: i.status,
      lastSentAt: i.lastSentAt, sendCount: i.sendCount, canRemind: canRemind(i, new Date()),
    })),
  };
}

async function ownsFlow(userId: string, flowId: string) {
  return !!(await prisma.flow.findFirst({ where: { id: flowId, userId }, select: { id: true } }));
}

async function sendInviteEmail(round: OwnedRound, to: string, kind: 'invite' | 'reminder', note: string) {
  const owner = await prisma.user.findUnique({ where: { id: round.ownerId }, select: { name: true, email: true } });
  const e = inviteEmail({
    lang: round.language === 'da' ? 'da' : 'en',
    kind,
    ownerName: owner?.name || '',
    ownerEmail: owner?.email || '',
    processName: round.processName,
    startTrigger: round.startTrigger,
    endPoint: round.endPoint,
    note,
    link: `${AILEAN_APP_URL.replace(/\/+$/, '')}/?round=${encodeURIComponent(round.inviteToken)}`,
  });
  return sendEmail(to, e.subject, e.html, { from: e.from, replyTo: e.replyTo, text: e.text });
}

// GET /api/v1/rounds/by-flow/:flowId — the round that collects descriptions of this flow
router.get('/by-flow/:flowId', async (req: AuthRequest, res: Response) => {
  try {
    const round = await prisma.asIsRound.findFirst({
      where: { flowId: req.params.flowId, ownerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: withParticipants,
    });
    if (!round) { res.status(404).json({ error: 'Not Found' }); return; }
    res.json(await ownerView(round));
  } catch (error) {
    logger.error('Get round by flow error:', error);
    res.status(500).json({ error: 'Failed to fetch round' });
  }
});

// POST /api/v1/rounds/from-flow — start collecting descriptions of one of the caller's flows
router.post('/from-flow', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const input = validateFlowRoundInput(req.body);
    if (!input.ok) { res.status(400).json({ error: input.error }); return; }
    if (!(await ownsFlow(userId, input.value.flowId))) { res.status(404).json({ error: 'Not Found' }); return; }

    const existing = await prisma.asIsRound.findFirst({
      where: { flowId: input.value.flowId, ownerId: userId }, orderBy: { createdAt: 'desc' }, include: withParticipants,
    });
    if (existing) { res.json(await ownerView(existing)); return; }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionTier: true, isAdmin: true } });
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!canStartRound(user)) { res.status(403).json({ error: 'PLAN_REQUIRED', code: 'PLAN_REQUIRED' }); return; }

    const round = await prisma.asIsRound.create({
      data: { ownerId: userId, inviteToken: newInviteToken(), ...input.value },
      include: withParticipants,
    });
    res.status(201).json(await ownerView(round));
  } catch (error) {
    logger.error('Create round from flow error:', error);
    res.status(500).json({ error: 'Failed to create round' });
  }
});

// ── Participant (registered before /:id so "invite" is never read as an id) ──

// GET /api/v1/rounds/invite/:token — the scope and the caller's own submission
router.get('/invite/:token', async (req: AuthRequest, res: Response) => {
  try {
    const round = await prisma.asIsRound.findUnique({
      where: { inviteToken: req.params.token },
      include: { owner: { select: { name: true, email: true } } },
    });
    if (!round) { res.status(404).json({ error: 'Not Found', code: 'INVITE_INVALID' }); return; }
    const own = await prisma.asIsSubmission.findUnique({
      where: { roundId_userId: { roundId: round.id, userId: req.user!.userId } },
    });
    res.json(invitationView(round, round.owner, own));
  } catch (error) {
    logger.error('Get invitation error:', error);
    res.status(500).json({ error: 'Failed to load invitation' });
  }
});

// PUT /api/v1/rounds/invite/:token/contribution — save or submit the caller's own contribution
router.put('/invite/:token/contribution', async (req: AuthRequest, res: Response) => {
  try {
    const round = await prisma.asIsRound.findUnique({ where: { inviteToken: req.params.token } });
    if (!round) { res.status(404).json({ error: 'Not Found', code: 'INVITE_INVALID' }); return; }
    if (!canContribute(round)) { res.status(409).json({ error: 'ROUND_CLOSED', code: 'ROUND_CLOSED' }); return; }

    const parsed = validateContribution(req.body);
    if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
    const userId = req.user!.userId;
    const where = { roundId_userId: { roundId: round.id, userId } };
    const existing = await prisma.asIsSubmission.findUnique({ where, select: { status: true, submittedAt: true, updatedAt: true } });
    const next = nextSubmission(existing, parsed.value);
    if (!next) { res.json(existing); return; } // the submitted version stands
    const data = { ...next, contribution: next.contribution as Prisma.InputJsonValue };

    const saved = await prisma.asIsSubmission.upsert({
      where,
      update: data,
      create: { roundId: round.id, userId, ...data },
      select: { status: true, submittedAt: true, updatedAt: true },
    });
    res.json(saved);
  } catch (error) {
    logger.error('Save contribution error:', error);
    res.status(500).json({ error: 'Failed to save contribution' });
  }
});

// DELETE /api/v1/rounds/invite/:token/contribution — withdraw the caller's own contribution
router.delete('/invite/:token/contribution', async (req: AuthRequest, res: Response) => {
  try {
    const round = await prisma.asIsRound.findUnique({ where: { inviteToken: req.params.token } });
    if (!round) { res.status(404).json({ error: 'Not Found', code: 'INVITE_INVALID' }); return; }
    if (!canContribute(round)) { res.status(409).json({ error: 'ROUND_CLOSED', code: 'ROUND_CLOSED' }); return; }
    await prisma.asIsSubmission.deleteMany({ where: { roundId: round.id, userId: req.user!.userId } });
    res.json({ ok: true });
  } catch (error) {
    logger.error('Withdraw contribution error:', error);
    res.status(500).json({ error: 'Failed to withdraw contribution' });
  }
});

// ── Owner ────────────────────────────────────────────────────────────────────

// POST /api/v1/rounds — start a round (paid plans only)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionTier: true, isAdmin: true } });
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!canStartRound(user)) { res.status(403).json({ error: 'PLAN_REQUIRED', code: 'PLAN_REQUIRED' }); return; }

    const input = validateRoundInput(req.body);
    if (!input.ok) { res.status(400).json({ error: input.error }); return; }

    const round = await prisma.asIsRound.create({
      data: { ownerId: userId, inviteToken: newInviteToken(), ...input.value },
      include: withParticipants,
    });
    res.status(201).json(ownerRoundView(round, round.submissions));
  } catch (error) {
    logger.error('Create round error:', error);
    res.status(500).json({ error: 'Failed to create round' });
  }
});

// GET /api/v1/rounds — the caller's own rounds with participant counts
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const rounds = await prisma.asIsRound.findMany({
      where: { ownerId: req.user!.userId },
      include: { submissions: { select: { status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rounds.map(({ submissions, ...round }) => {
      const counts = { opened: 0, started: 0, submitted: 0 };
      submissions.forEach(s => { if (s.status in counts) counts[s.status as keyof typeof counts]++; });
      return roundSummary(round, counts);
    }));
  } catch (error) {
    logger.error('List rounds error:', error);
    res.status(500).json({ error: 'Failed to fetch rounds' });
  }
});

// GET /api/v1/rounds/:id — one round with every submission
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const round = await ownedRound(req, res);
    if (round) res.json(await ownerView(round));
  } catch (error) {
    logger.error('Get round error:', error);
    res.status(500).json({ error: 'Failed to fetch round' });
  }
});

async function setStatus(req: AuthRequest, res: Response, status: 'open' | 'closed') {
  const round = await ownedRound(req, res);
  if (!round) return;
  if (round.status === 'promoted') { res.status(409).json({ error: 'ROUND_PROMOTED', code: 'ROUND_PROMOTED' }); return; }
  const updated = await prisma.asIsRound.update({ where: { id: round.id }, data: { status }, include: withParticipants });
  res.json(await ownerView(updated));
}

// POST /api/v1/rounds/:id/close — stop accepting contributions
router.post('/:id/close', async (req: AuthRequest, res: Response) => {
  try { await setStatus(req, res, 'closed'); } catch (error) {
    logger.error('Close round error:', error);
    res.status(500).json({ error: 'Failed to close round' });
  }
});

// POST /api/v1/rounds/:id/reopen — accept contributions again
router.post('/:id/reopen', async (req: AuthRequest, res: Response) => {
  try { await setStatus(req, res, 'open'); } catch (error) {
    logger.error('Reopen round error:', error);
    res.status(500).json({ error: 'Failed to reopen round' });
  }
});

// POST /api/v1/rounds/:id/renew-link — new link; the old one stops working at once
router.post('/:id/renew-link', async (req: AuthRequest, res: Response) => {
  try {
    const round = await ownedRound(req, res);
    if (!round) return;
    const updated = await prisma.asIsRound.update({
      where: { id: round.id }, data: { inviteToken: newInviteToken() }, include: withParticipants,
    });
    res.json(await ownerView(updated));
  } catch (error) {
    logger.error('Renew round link error:', error);
    res.status(500).json({ error: 'Failed to renew link' });
  }
});

// POST /api/v1/rounds/:id/link — attach an existing round to one of the caller's flows
router.post('/:id/link', async (req: AuthRequest, res: Response) => {
  try {
    const round = await ownedRound(req, res);
    if (!round) return;
    const flowId = typeof req.body?.flowId === 'string' ? req.body.flowId : '';
    if (!flowId || !(await ownsFlow(req.user!.userId, flowId))) { res.status(404).json({ error: 'Not Found' }); return; }
    const updated = await prisma.asIsRound.update({ where: { id: round.id }, data: { flowId }, include: withParticipants });
    res.json(await ownerView(updated));
  } catch (error) {
    logger.error('Link round error:', error);
    res.status(500).json({ error: 'Failed to link round' });
  }
});

// POST /api/v1/rounds/:id/invites — email people and ask them to describe the process
router.post('/:id/invites', async (req: AuthRequest, res: Response) => {
  try {
    const round = await ownedRound(req, res);
    if (!round) return;
    if (!canContribute(round)) { res.status(409).json({ error: 'ROUND_CLOSED', code: 'ROUND_CLOSED' }); return; }

    const { valid, invalid } = parseEmails(req.body?.emails);
    if (invalid.length) { res.status(400).json({ error: 'INVALID_EMAILS', code: 'INVALID_EMAILS', invalid }); return; }
    if (!valid.length) { res.status(400).json({ error: 'No email addresses', code: 'NO_EMAILS' }); return; }
    const note = validateNote(req.body?.note);
    if (!note.ok) { res.status(400).json({ error: note.error }); return; }

    const existing = await prisma.roundInvite.findMany({ where: { roundId: round.id }, select: { email: true } });
    const known = new Set(existing.map(e => e.email));
    const fresh = valid.filter(e => !known.has(e));
    if (existing.length + fresh.length > MAX_INVITES_PER_ROUND) {
      res.status(400).json({ error: `At most ${MAX_INVITES_PER_ROUND} people per process`, code: 'TOO_MANY_INVITES' });
      return;
    }

    const sent: string[] = [];
    const failed: string[] = [];
    for (const email of fresh) {
      const ok = await sendInviteEmail(round, email, 'invite', note.value);
      if (!ok) { failed.push(email); continue; }
      await prisma.roundInvite.create({ data: { roundId: round.id, email, note: note.value, lastSentAt: new Date() } });
      sent.push(email);
    }
    res.json({ sent, failed, alreadyInvited: valid.filter(e => known.has(e)), round: await ownerView(round) });
  } catch (error) {
    logger.error('Send invites error:', error);
    res.status(500).json({ error: 'Failed to send invitations' });
  }
});

// POST /api/v1/rounds/:id/remind — remind everyone invited who has not submitted (once a day at most)
router.post('/:id/remind', async (req: AuthRequest, res: Response) => {
  try {
    const round = await ownedRound(req, res);
    if (!round) return;
    if (!canContribute(round)) { res.status(409).json({ error: 'ROUND_CLOSED', code: 'ROUND_CLOSED' }); return; }

    const now = new Date();
    const due = inviteStatuses(await loadInvites(round.id), round.submissions).filter(i => canRemind(i, now));
    const sent: string[] = [];
    const failed: string[] = [];
    for (const i of due) {
      if (await sendInviteEmail(round, i.email, 'reminder', i.note)) {
        await prisma.roundInvite.update({ where: { id: i.id }, data: { lastSentAt: new Date(), sendCount: { increment: 1 } } });
        sent.push(i.email);
      } else {
        failed.push(i.email);
      }
    }
    res.json({ sent, failed, round: await ownerView(round) });
  } catch (error) {
    logger.error('Send reminders error:', error);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

// DELETE /api/v1/rounds/:id/invites/:inviteId — stop tracking someone (their submission, if any, stays)
router.delete('/:id/invites/:inviteId', async (req: AuthRequest, res: Response) => {
  try {
    const round = await ownedRound(req, res);
    if (!round) return;
    await prisma.roundInvite.deleteMany({ where: { id: req.params.inviteId, roundId: round.id } });
    res.json(await ownerView(round));
  } catch (error) {
    logger.error('Remove invite error:', error);
    res.status(500).json({ error: 'Failed to remove invitation' });
  }
});

export default router;
