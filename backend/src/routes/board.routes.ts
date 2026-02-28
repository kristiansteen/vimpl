import { Router } from 'express';
import boardController from '../controllers/board.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /boards:
 *   get:
 *     summary: Get all boards for the current user
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of boards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 boards:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Board'
 *       401:
 *         description: Unauthorized
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
 *                 example: My Planning Board
 *               description:
 *                 type: string
 *                 example: A board for sprint planning
 *     responses:
 *       201:
 *         description: Board created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 board:
 *                   $ref: '#/components/schemas/Board'
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, boardController.createBoard);

/**
 * @swagger
 * /boards/slug/{slug}:
 *   get:
 *     summary: Get a board by its slug
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The board slug
 *     responses:
 *       200:
 *         description: Board data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 board:
 *                   $ref: '#/components/schemas/Board'
 *       404:
 *         description: Board not found
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
 *               type: object
 *               properties:
 *                 board:
 *                   $ref: '#/components/schemas/Board'
 *       404:
 *         description: Board not found
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
 *               version:
 *                 type: integer
 *                 description: Current version for optimistic locking
 *     responses:
 *       200:
 *         description: Board updated
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Version conflict
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Board shared successfully
 *       401:
 *         description: Unauthorized
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
 *       200:
 *         description: Board deleted
 *       404:
 *         description: Board not found
 */
router.delete('/:id', authenticate, boardController.deleteBoard);

// --- Section routes ---

/**
 * @swagger
 * /boards/{boardId}/sections:
 *   post:
 *     summary: Create a new section in a board
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
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 section:
 *                   $ref: '#/components/schemas/Section'
 *       403:
 *         description: Forbidden
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: object
 *               positionX:
 *                 type: integer
 *               positionY:
 *                 type: integer
 *               width:
 *                 type: integer
 *               height:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Section updated
 *       403:
 *         description: Forbidden
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
 *       200:
 *         description: Section deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:boardId/sections/:id', authenticate, boardController.deleteSection);

// --- Post-it routes ---

/**
 * @swagger
 * /boards/{boardId}/postits:
 *   post:
 *     summary: Create a new post-it note
 *     description: Creates a post-it note within a specific section of a board. Requires edit permission on the board.
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
 *         description: The board ID
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
 *                 description: The section to place the post-it in
 *               color:
 *                 type: string
 *                 enum: [yellow, pink, blue, green, orange]
 *                 example: yellow
 *               content:
 *                 type: string
 *                 example: Review sprint backlog
 *               owner:
 *                 type: string
 *                 example: Kristian
 *               status:
 *                 type: string
 *                 enum: [todo, inprogress, done]
 *                 default: todo
 *               positionX:
 *                 type: number
 *                 example: 100
 *               positionY:
 *                 type: number
 *                 example: 200
 *               xValue:
 *                 type: integer
 *                 description: X-axis value (for matrix sections)
 *               yValue:
 *                 type: integer
 *                 description: Y-axis value (for matrix sections)
 *               riskScore:
 *                 type: integer
 *                 description: Risk score (for matrix sections)
 *               mitigation:
 *                 type: string
 *                 description: Mitigation plan (for matrix sections)
 *     responses:
 *       201:
 *         description: Post-it created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 postit:
 *                   $ref: '#/components/schemas/Postit'
 *       403:
 *         description: Forbidden — no edit permission on board
 *       401:
 *         description: Unauthorized
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *               positionX:
 *                 type: number
 *               positionY:
 *                 type: number
 *     responses:
 *       200:
 *         description: Post-it updated
 *       403:
 *         description: Forbidden
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
 *       200:
 *         description: Post-it deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:boardId/postits/:id', authenticate, boardController.deletePostit);

export default router;
