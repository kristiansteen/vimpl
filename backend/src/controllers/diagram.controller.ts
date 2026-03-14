import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

const diagramController = {
  /**
   * GET /api/v1/diagrams
   * Returns a list of the authenticated user's diagrams (without xml body — keeps responses small).
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const diagrams = await prisma.bpmnDiagram.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, processName: true, createdAt: true, updatedAt: true },
      });
      res.json(diagrams);
    } catch (err) {
      logger.error('diagram.list error:', err);
      res.status(500).json({ error: 'Failed to list diagrams' });
    }
  },

  /**
   * GET /api/v1/diagrams/:id
   * Returns a single diagram including its xml.
   */
  async get(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const diagram = await prisma.bpmnDiagram.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!diagram) {
        res.status(404).json({ error: 'Diagram not found' });
        return;
      }
      res.json(diagram);
    } catch (err) {
      logger.error('diagram.get error:', err);
      res.status(500).json({ error: 'Failed to load diagram' });
    }
  },

  /**
   * POST /api/v1/diagrams
   * Creates a new diagram. Requires { name, xml } in the body.
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { name, xml, processName } = req.body;

      if (!name || !xml) {
        res.status(400).json({ error: 'name and xml are required' });
        return;
      }

      const diagram = await prisma.bpmnDiagram.create({
        data: {
          userId,
          name: name.trim(),
          xml,
          processName: processName?.trim() || null,
        },
      });

      res.status(201).json(diagram);
    } catch (err) {
      logger.error('diagram.create error:', err);
      res.status(500).json({ error: 'Failed to save diagram' });
    }
  },

  /**
   * PUT /api/v1/diagrams/:id
   * Updates an existing diagram's name and/or xml.
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const existing = await prisma.bpmnDiagram.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!existing) {
        res.status(404).json({ error: 'Diagram not found' });
        return;
      }

      const { name, xml, processName } = req.body;
      const diagram = await prisma.bpmnDiagram.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(xml !== undefined && { xml }),
          ...(processName !== undefined && { processName: processName?.trim() || null }),
        },
      });

      res.json(diagram);
    } catch (err) {
      logger.error('diagram.update error:', err);
      res.status(500).json({ error: 'Failed to update diagram' });
    }
  },

  /**
   * DELETE /api/v1/diagrams/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const existing = await prisma.bpmnDiagram.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!existing) {
        res.status(404).json({ error: 'Diagram not found' });
        return;
      }
      await prisma.bpmnDiagram.delete({ where: { id: req.params.id } });
      res.status(204).end();
    } catch (err) {
      logger.error('diagram.delete error:', err);
      res.status(500).json({ error: 'Failed to delete diagram' });
    }
  },
};

export default diagramController;
