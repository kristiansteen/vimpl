import { Router } from 'express';
import boardController from '../controllers/board.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /boards:
 *   get:
 *     summary: Get all boards for the authenticated user
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of boards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Board'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, boardController.getBoards);

/**
 * @swagger
 * /boards:
 *   post:
 *     summary: Create a new board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Board created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authenticate, boardController.createBoard);

/**
 * @swagger
 * /boards/slug/{slug}:
 *   get:
 *     summary: Get a board by its slug (public or authenticated)
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Board data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/slug/:slug', optionalAuthenticate, boardController.getBoardBySlug);

/**
 * @swagger
 * /boards/{id}:
 *   get:
 *     summary: Get a board by ID
 *     tags: [Boards]
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
 *         description: Board data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authenticate, boardController.getBoard);

/**
 * @swagger
 * /boards/{id}:
 *   put:
 *     summary: Update a board
 *     tags: [Boards]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               gridData:
 *                 type: object
 *               settings:
 *                 type: object
 *               isPublic:
 *                 type: boolean
 *               version:
 *                 type: integer
 *                 description: Current version for optimistic locking
 *     responses:
 *       200:
 *         description: Board updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 *       409:
 *         description: Version conflict (optimistic locking)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticate, boardController.updateBoard);

/**
 * @swagger
 * /boards/{id}/share:
 *   post:
 *     summary: Share a board with another user
 *     tags: [Boards]
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
 *             required:
 *               - email
 *               - permission
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               permission:
 *                 type: string
 *                 enum: [view, edit, admin]
 *     responses:
 *       200:
 *         description: Board shared successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/share', authenticate, boardController.shareBoard);

/**
 * @swagger
 * /boards/{id}:
 *   delete:
 *     summary: Delete a board
 *     tags: [Boards]
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
 *         description: Board deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, boardController.deleteBoard);

/**
 * @swagger
 * /boards/{boardId}/sections:
 *   post:
 *     summary: Create a section within a board
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
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
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [text, matrix, weekplan, kpi, actions, postit-area, team]
 *               title:
 *                 type: string
 *               positionX:
 *                 type: integer
 *               positionY:
 *                 type: integer
 *               width:
 *                 type: integer
 *               height:
 *                 type: integer
 *               content:
 *                 type: object
 *     responses:
 *       201:
 *         description: Section created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Section'
 */
router.post('/:boardId/sections', authenticate, boardController.createSection);

/**
 * @swagger
 * /boards/{boardId}/sections/{id}:
 *   put:
 *     summary: Update a section
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *               title:
 *                 type: string
 *               positionX:
 *                 type: integer
 *               positionY:
 *                 type: integer
 *               width:
 *                 type: integer
 *               height:
 *                 type: integer
 *               content:
 *                 type: object
 *               isLocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Section updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Section'
 */
router.put('/:boardId/sections/:id', authenticate, boardController.updateSection);

/**
 * @swagger
 * /boards/{boardId}/sections/{id}:
 *   delete:
 *     summary: Delete a section
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Section deleted
 */
router.delete('/:boardId/sections/:id', authenticate, boardController.deleteSection);

/**
 * @swagger
 * /boards/{boardId}/postits:
 *   post:
 *     summary: Create a post-it note within a board section
 *     tags: [Post-its]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
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
 *             required:
 *               - sectionId
 *               - color
 *             properties:
 *               sectionId:
 *                 type: string
 *                 format: uuid
 *               color:
 *                 type: string
 *                 enum: [yellow, pink, blue, green, orange]
 *               content:
 *                 type: string
 *               owner:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, inprogress, done]
 *     responses:
 *       201:
 *         description: Post-it created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Postit'
 */
router.post('/:boardId/postits', authenticate, boardController.createPostit);

/**
 * @swagger
 * /boards/{boardId}/postits/{id}:
 *   put:
 *     summary: Update a post-it note
 *     tags: [Post-its]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *               content:
 *                 type: string
 *               color:
 *                 type: string
 *                 enum: [yellow, pink, blue, green, orange]
 *               owner:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, inprogress, done]
 *               positionX:
 *                 type: number
 *               positionY:
 *                 type: number
 *               xValue:
 *                 type: integer
 *               yValue:
 *                 type: integer
 *               riskScore:
 *                 type: integer
 *               mitigation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post-it updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Postit'
 */
router.put('/:boardId/postits/:id', authenticate, boardController.updatePostit);

/**
 * @swagger
 * /boards/{boardId}/postits/{id}:
 *   delete:
 *     summary: Delete a post-it note
 *     tags: [Post-its]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Post-it deleted
 */
router.delete('/:boardId/postits/:id', authenticate, boardController.deletePostit);

export default router;
