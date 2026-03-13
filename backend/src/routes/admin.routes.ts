import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication.
// TODO: Add an admin-role middleware before deploying to production.

/**
 * @swagger
 * /admin/login-audits/download:
 *   get:
 *     summary: Download all login audit records as JSON
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full login audit export
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LoginAudit'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/login-audits/download', authenticate, adminController.downloadLoginAudits);

/**
 * @swagger
 * /admin/login-audits/stats:
 *   get:
 *     summary: Aggregate login statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Login statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 successCount:
 *                   type: integer
 *                 failureCount:
 *                   type: integer
 *                 successRate:
 *                   type: number
 *                   format: float
 *                 byMethod:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: integer
 *                     google:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/login-audits/stats', authenticate, adminController.getLoginStats);

/**
 * @swagger
 * /admin/login-audits:
 *   get:
 *     summary: Query login audit records with optional filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filter by login success/failure
 *       - in: query
 *         name: loginMethod
 *         schema:
 *           type: string
 *           enum: [email, google]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Filtered login audit records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LoginAudit'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/login-audits', authenticate, adminController.getLoginAudits);

/**
 * @swagger
 * /admin/users/{userId}/login-history:
 *   get:
 *     summary: Get login history for a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Login history for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LoginAudit'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/users/:userId/login-history', authenticate, adminController.getUserLoginHistory);

/**
 * @swagger
 * /admin/subscriptions:
 *   get:
 *     summary: List all users with their subscription status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All user subscription records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     format: uuid
 *                   email:
 *                     type: string
 *                   tier:
 *                     type: string
 *                     enum: [student, commercial, enterprise]
 *                   status:
 *                     type: string
 *                   currentPeriodEnd:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/subscriptions', authenticate, adminController.getAllSubscriptions);

export default router;
