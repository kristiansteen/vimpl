import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import prisma from '../config/database';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { Response } from 'express';

const router = Router();

router.use(authenticate);

// GET /api/v1/flows — list flows for the authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const flows = await prisma.flow.findMany({
      where: { userId: req.user!.userId },
      select: { id: true, name: true, data: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(flows);
  } catch (error) {
    logger.error('List flows error:', error);
    res.status(500).json({ error: 'Failed to fetch flows' });
  }
});

// PUT /api/v1/flows/:id — upsert a flow
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, data } = req.body;
    const userId = req.user!.userId;

    // If the flow exists and belongs to a different user, return 403
    const existing = await prisma.flow.findUnique({ where: { id }, select: { userId: true } });
    if (existing && existing.userId !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'Flow belongs to another account' });
      return;
    }

    const flow = await prisma.flow.upsert({
      where: { id },
      update: { name: name || 'Untitled process', data: data ?? {} },
      create: { id, userId, name: name || 'Untitled process', data: data ?? {} },
      select: { id: true, name: true, updatedAt: true },
    });
    res.json(flow);
  } catch (error) {
    logger.error('Upsert flow error:', error);
    res.status(500).json({ error: 'Failed to save flow' });
  }
});

// DELETE /api/v1/flows/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.flow.findUnique({ where: { id }, select: { userId: true } });
    if (!existing) { res.status(404).json({ error: 'Not Found' }); return; }
    if (existing.userId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

    await prisma.flow.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    logger.error('Delete flow error:', error);
    res.status(500).json({ error: 'Failed to delete flow' });
  }
});

export default router;
