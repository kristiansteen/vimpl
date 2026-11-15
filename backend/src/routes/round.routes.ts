// AS-IS rounds for voice-2-launch: a process owner invites several people to
// describe the same process. Access rules live in services/round.policy.ts.
//
// Owner:        POST /, GET /, GET /:id, POST /:id/close|reopen|renew-link
// Participant:  GET /invite/:token, PUT|DELETE /invite/:token/contribution
// Every route requires login. Participants never receive anyone else's input.

import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import logger from '../utils/logger';
import {
  newInviteToken, canStartRound, validateRoundInput, validateContribution,
  canContribute, invitationView, ownerRoundView, roundSummary,
} from '../services/round.policy';

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
    const { status, contribution } = parsed.value;
    const userId = req.user!.userId;
    const data = {
      status,
      contribution: contribution as Prisma.InputJsonValue,
      submittedAt: status === 'submitted' ? new Date() : null,
    };

    const saved = await prisma.asIsSubmission.upsert({
      where: { roundId_userId: { roundId: round.id, userId } },
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
    if (round) res.json(ownerRoundView(round, round.submissions));
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
  res.json(ownerRoundView(updated, updated.submissions));
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
    res.json(ownerRoundView(updated, updated.submissions));
  } catch (error) {
    logger.error('Renew round link error:', error);
    res.status(500).json({ error: 'Failed to renew link' });
  }
});

export default router;
