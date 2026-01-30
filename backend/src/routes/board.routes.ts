import { Router } from 'express';
import boardController from '../controllers/board.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Board routes (all require authentication)
router.get('/', authenticate, boardController.getBoards);
router.post('/', authenticate, boardController.createBoard);
router.get('/slug/:slug', optionalAuthenticate, boardController.getBoardBySlug);
router.get('/:id', authenticate, boardController.getBoard);
router.put('/:id', authenticate, boardController.updateBoard);
router.post('/:id/share', authenticate, boardController.shareBoard);
router.delete('/:id', authenticate, boardController.deleteBoard);

// Section routes
router.post('/:boardId/sections', authenticate, boardController.createSection);
router.put('/:boardId/sections/:id', authenticate, boardController.updateSection);
router.delete('/:boardId/sections/:id', authenticate, boardController.deleteSection);

// Post-it routes
router.post('/:boardId/postits', authenticate, boardController.createPostit);
router.put('/:boardId/postits/:id', authenticate, boardController.updatePostit);
router.delete('/:boardId/postits/:id', authenticate, boardController.deletePostit);

export default router;
