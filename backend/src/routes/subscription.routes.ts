import { Router } from 'express';
import subscriptionController from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /subscription/tiers:
 *   get:
 *     summary: List all available subscription tiers
 *     tags: [Subscription]
 *     security: []
 *     responses:
 *       200:
 *         description: Array of subscription tier definitions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubscriptionTier'
 */
router.get('/tiers', subscriptionController.getTiers);

/**
 * @swagger
 * /subscription/current:
 *   get:
 *     summary: Get the current user's subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tier:
 *                   type: string
 *                   enum: [student, commercial, enterprise]
 *                 status:
 *                   type: string
 *                   enum: [active, expired, cancelled]
 *                 currentPeriodEnd:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/current', authenticate, subscriptionController.getCurrentSubscription);

/**
 * @swagger
 * /subscription/can-create-board:
 *   get:
 *     summary: Check whether the current user can create another board
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permission check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allowed:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *                   nullable: true
 *                   description: Populated when allowed is false
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/can-create-board', authenticate, subscriptionController.canCreateBoard);

/**
 * @swagger
 * /subscription/upgrade:
 *   post:
 *     summary: Upgrade to the Commercial tier
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription upgraded to Commercial
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/upgrade', authenticate, subscriptionController.upgradeToCommercial);

/**
 * @swagger
 * /subscription/upgrade-enterprise:
 *   post:
 *     summary: Upgrade to the Enterprise tier
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription upgraded to Enterprise
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/upgrade-enterprise', authenticate, subscriptionController.upgradeToEnterprise);

/**
 * @swagger
 * /subscription/downgrade:
 *   post:
 *     summary: Downgrade to the free Student tier
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription downgraded to Student
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/downgrade', authenticate, subscriptionController.downgradeToStudent);

export default router;
