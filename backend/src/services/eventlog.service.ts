import prisma from '../config/database';

export interface EventLogQueryOptions {
    eventType?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
}

class EventLogService {
    /**
     * Get event logs for a specific board.
     * Validates that the requesting user owns the board or is a collaborator.
     */
    async getEventsByBoardId(
        boardId: string,
        userId: string,
        options: EventLogQueryOptions = {}
    ) {
        // Verify the user has access to this board
        const board = await prisma.board.findFirst({
            where: {
                id: boardId,
                OR: [
                    { userId },
                    { collaborators: { some: { userId } } },
                ],
            },
            select: { id: true },
        });

        if (!board) {
            const error: any = new Error('Board not found or access denied');
            error.statusCode = 404;
            throw error;
        }

        const { eventType, from, to } = options;
        const limit = Math.min(options.limit || 50, 200);
        const offset = options.offset || 0;

        // Build where clause
        const where: any = { boardId };

        if (eventType) {
            where.eventType = eventType;
        }

        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lte = new Date(to);
        }

        // Query with count for pagination
        const [events, total] = await Promise.all([
            prisma.eventLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.eventLog.count({ where }),
        ]);

        return {
            events,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        };
    }
}

export default new EventLogService();
