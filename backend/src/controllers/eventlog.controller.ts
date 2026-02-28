import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import eventLogService from '../services/eventlog.service';
import logger from '../utils/logger';

class EventLogController {
    /**
     * Get event log for a board
     * GET /api/v1/boards/:boardId/eventlog
     */
    async getEventLog(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { boardId } = req.params;
            const { eventType, from, to, limit, offset } = req.query;

            const result = await eventLogService.getEventsByBoardId(
                boardId,
                req.user.userId,
                {
                    eventType: eventType as string | undefined,
                    from: from as string | undefined,
                    to: to as string | undefined,
                    limit: limit ? parseInt(limit as string, 10) : undefined,
                    offset: offset ? parseInt(offset as string, 10) : undefined,
                }
            );

            res.json(result);
        } catch (error: any) {
            logger.error('Get event log error:', error);

            if (error.statusCode === 404) {
                res.status(404).json({
                    error: 'Not Found',
                    message: error.message,
                });
                return;
            }

            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to fetch event log',
            });
        }
    }
}

export default new EventLogController();
