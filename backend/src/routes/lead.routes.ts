import { Router } from 'express';
import leadController from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: Lead capture and management for downloads
 */

const router = Router();

/**
 * @swagger
 * /api/v1/leads:
 *   post:
 *     summary: Capture a new lead and send whitepaper
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - selectedDocuments
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "+4512345678"
 *               selectedDocuments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["AILEAN White Paper.pdf"]
 *     responses:
 *       201:
 *         description: Lead captured successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/', leadController.handleLead);

/**
 * @swagger
 * /api/v1/leads:
 *   get:
 *     summary: Get all leads (Admin only)
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leads
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, leadController.getLeads);

export default router;
