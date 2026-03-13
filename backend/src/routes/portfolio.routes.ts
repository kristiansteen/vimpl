import { Router } from 'express';
import portfolioController from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /portfolio/dashboard:
 *   get:
 *     summary: Get the portfolio dashboard — all boards with stats
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalBoards:
 *                       type: integer
 *                     totalPostits:
 *                       type: integer
 *                     completionRate:
 *                       type: number
 *                       format: float
 *                       description: Fraction of post-its with status=done (0–1)
 *                     activeBoards:
 *                       type: integer
 *                       description: Boards accessed in the last 30 days
 *                 boards:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       sections:
 *                         type: integer
 *                       postits:
 *                         type: integer
 *                       statusCounts:
 *                         type: object
 *                         properties:
 *                           todo:
 *                             type: integer
 *                           inprogress:
 *                             type: integer
 *                           done:
 *                             type: integer
 *                       teamSize:
 *                         type: integer
 *                       lastAccessedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/dashboard', authenticate, portfolioController.getDashboard);

/**
 * @swagger
 * /portfolio/comparison:
 *   get:
 *     summary: Compare metrics across all boards
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comparison metrics for each board
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   boardId:
 *                     type: string
 *                     format: uuid
 *                   title:
 *                     type: string
 *                   postits:
 *                     type: integer
 *                   completionRate:
 *                     type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/comparison', authenticate, portfolioController.getBoardComparison);

/**
 * @swagger
 * /portfolio/activity:
 *   get:
 *     summary: Recent activity across all the user's boards
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of activity events to return
 *     responses:
 *       200:
 *         description: Recent activity events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EventLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/activity', authenticate, portfolioController.getRecentActivity);

export default router;
