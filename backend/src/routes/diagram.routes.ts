import { Router } from 'express';
import diagramController from '../controllers/diagram.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /diagrams:
 *   get:
 *     summary: List the authenticated user's saved BPMN diagrams
 *     tags: [Diagrams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of diagram summaries (no xml body)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, diagramController.list);

/**
 * @swagger
 * /diagrams/{id}:
 *   get:
 *     summary: Get a single diagram including its BPMN XML
 *     tags: [Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Full diagram object including xml
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authenticate, diagramController.get);

/**
 * @swagger
 * /diagrams:
 *   post:
 *     summary: Save a new BPMN diagram
 *     tags: [Diagrams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, xml]
 *             properties:
 *               name:
 *                 type: string
 *               xml:
 *                 type: string
 *                 description: Full BPMN 2.0 XML string
 *               processName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Diagram saved
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', authenticate, diagramController.create);

/**
 * @swagger
 * /diagrams/{id}:
 *   put:
 *     summary: Update an existing diagram's name or xml
 *     tags: [Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               xml:
 *                 type: string
 *               processName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Diagram updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authenticate, diagramController.update);

/**
 * @swagger
 * /diagrams/{id}:
 *   delete:
 *     summary: Delete a diagram
 *     tags: [Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, diagramController.delete);

export default router;
