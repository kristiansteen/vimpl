import { Response } from 'express';
import boardService from '../services/board.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

class BoardController {
  /**
   * Get all boards for the current user
   * GET /api/v1/boards
   */
  async getBoards(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const boards = await boardService.getUserBoards(req.user.userId);

      res.json({ boards });
    } catch (error) {
      logger.error('Get boards error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch boards',
      });
    }
  }

  /**
   * Get a single board by ID
   * GET /api/v1/boards/:id
   */
  async getBoard(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const board = await boardService.getBoardById(id, req.user.userId);

      if (!board) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Board not found',
        });
        return;
      }

      res.json({ board });
    } catch (error) {
      logger.error('Get board error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch board',
      });
    }
  }

  /**
   * Get board by slug
   * GET /api/v1/boards/slug/:slug
   */
  async getBoardBySlug(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const board = await boardService.getBoardBySlug(slug, req.user?.userId);

      if (!board) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Board not found',
        });
        return;
      }

      res.json({ board });
    } catch (error) {
      logger.error('Get board by slug error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch board',
      });
    }
  }

  /**
   * Create a new board
   * POST /api/v1/boards
   */
  async createBoard(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { title, description } = req.body;

      if (!title) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Title is required',
        });
        return;
      }

      const board = await boardService.createBoard(
        req.user.userId,
        title,
        description
      );

      res.status(201).json({
        message: 'Board created successfully',
        board,
      });
    } catch (error) {
      logger.error('Create board error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to create board',
      });
    }
  }

  /**
   * Update a board
   * PUT /api/v1/boards/:id
   */
  async updateBoard(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const board = await boardService.updateBoard(id, req.user.userId, updateData);

      res.json({
        message: 'Board updated successfully',
        board,
      });
    } catch (error: any) {
      logger.error('Update board error:', error);

      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to update board',
      });
    }
  }

  /**
   * Delete a board
   * DELETE /api/v1/boards/:id
   */
  async deleteBoard(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      await boardService.deleteBoard(id, req.user.userId);

      res.json({ message: 'Board deleted successfully' });
    } catch (error: any) {
      logger.error('Delete board error:', error);

      if (error.message.includes('not found') || error.message.includes('unauthorized')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to delete board',
      });
    }
  }

  /**
   * Create a section
   * POST /api/v1/boards/:boardId/sections
   */
  async createSection(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { boardId } = req.params;
      const sectionData = req.body;

      const section = await boardService.createSection(
        boardId,
        req.user.userId,
        sectionData
      );

      res.status(201).json({
        message: 'Section created successfully',
        section,
      });
    } catch (error: any) {
      logger.error('Create section error:', error);

      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to create section',
      });
    }
  }

  /**
   * Update a section
   * PUT /api/v1/boards/:boardId/sections/:id
   */
  async updateSection(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const section = await boardService.updateSection(id, req.user.userId, updateData);

      res.json({
        message: 'Section updated successfully',
        section,
      });
    } catch (error: any) {
      logger.error('Update section error:', error);

      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to update section',
      });
    }
  }

  /**
   * Delete a section
   * DELETE /api/v1/boards/:boardId/sections/:id
   */
  async deleteSection(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      await boardService.deleteSection(id, req.user.userId);

      res.json({ message: 'Section deleted successfully' });
    } catch (error: any) {
      logger.error('Delete section error:', error);

      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to delete section',
      });
    }
  }

  /**
   * Create a post-it
   * POST /api/v1/boards/:boardId/postits
   */
  async createPostit(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { boardId } = req.params;
      const postitData = { ...req.body, boardId };

      const postit = await boardService.createPostit(
        boardId,
        req.user.userId,
        postitData
      );

      res.status(201).json({
        message: 'Post-it created successfully',
        postit,
      });
    } catch (error: any) {
      logger.error('Create post-it error:', error);

      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to create post-it',
      });
    }
  }

  /**
   * Update a post-it
   * PUT /api/v1/boards/:boardId/postits/:id
   */
  async updatePostit(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const postit = await boardService.updatePostit(id, req.user.userId, updateData);

      res.json({
        message: 'Post-it updated successfully',
        postit,
      });
    } catch (error: any) {
      logger.error('Update post-it error:', error);

      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to update post-it',
      });
    }
  }

  /**
   * Delete a post-it
   * DELETE /api/v1/boards/:boardId/postits/:id
   */
  async deletePostit(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      await boardService.deletePostit(id, req.user.userId);

      res.json({ message: 'Post-it deleted successfully' });
    } catch (error: any) {
      logger.error('Delete post-it error:', error);

      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to delete post-it',
      });
    }
  }
}

export default new BoardController();
