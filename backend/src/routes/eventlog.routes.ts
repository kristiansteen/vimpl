import { Router } from 'express';
import eventLogController from '../controllers/eventlog.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /boards/{boardId}/eventlog:
 *   get:
 *     summary: Get the event log for a board
 *     tags: [Event Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of events to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of events to skip
 *     responses:
 *       200:
 *         description: List of events for the board
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EventLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', authenticate, eventLogController.getEventLog);

export default router;
