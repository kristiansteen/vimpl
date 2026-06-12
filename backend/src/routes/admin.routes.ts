import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

const guard = [authenticate, requireAdmin];

// ── Admin probe ───────────────────────────────────────────────────────
router.get('/check', ...guard, (_req, res) => res.json({ ok: true }));

// ── Analytics ─────────────────────────────────────────────────────────
router.get('/stats', ...guard, adminController.getStats);

// ── User management ───────────────────────────────────────────────────
router.get('/users', ...guard, adminController.listUsers);
router.get('/users/:userId', ...guard, adminController.getUser);
router.patch('/users/:userId/subscription', ...guard, adminController.updateSubscription);
router.post('/users/:userId/onboarding/:day', ...guard, adminController.triggerOnboarding);
router.delete('/users/:userId', ...guard, adminController.deleteUser);

// ── Board management ──────────────────────────────────────────────────
router.get('/boards', ...guard, adminController.listBoards);
router.get('/boards/:boardId', ...guard, adminController.getBoard);
router.post('/boards/:boardId/collaborators', ...guard, adminController.addCollaborator);
router.delete('/boards/:boardId/collaborators/:userId', ...guard, adminController.removeCollaborator);

// ── Login audits ──────────────────────────────────────────────────────
router.get('/login-audits/download', ...guard, adminController.downloadLoginAudits);
router.get('/login-audits/stats', ...guard, adminController.getLoginStats);
router.get('/login-audits', ...guard, adminController.getLoginAudits);
router.get('/users/:userId/login-history', ...guard, adminController.getUserLoginHistory);

// ── Subscriptions (legacy) ────────────────────────────────────────────
router.get('/subscriptions', ...guard, adminController.getAllSubscriptions);

export default router;
