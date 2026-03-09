import prisma from '../config/database';
import { Board } from '@prisma/client';
import { sendInviteEmail } from './email.service';
import config from '../config';
import logger from '../utils/logger';

export async function checkBoardPermission(
    boardId: string,
    userId: string,
    requiredPermission: 'view' | 'edit' | 'admin'
): Promise<boolean> {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
            collaborators: {
                where: { userId, acceptedAt: { not: null } },
            },
        },
    });

    if (!board) return false;
    if (board.userId === userId) return true;
    if (board.isPublic && requiredPermission === 'view') return true;

    const collaborator = board.collaborators[0];
    if (!collaborator) return false;

    const levels = { view: 1, edit: 2, admin: 3 };
    return levels[collaborator.permission as keyof typeof levels] >= levels[requiredPermission];
}

async function generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.board.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter++}`;
    }
    return slug;
}

class BoardService {
    async createBoard(userId: string, title: string, description?: string): Promise<Board> {
        const subscriptionService = (await import('./subscription.service')).default;
        const { allowed, reason } = await subscriptionService.canCreateBoard(userId);

        if (!allowed) {
            logger.warn(`Board creation denied for user ${userId}: ${reason}`);
            throw new Error(reason || 'Cannot create board');
        }

        const slug = await generateUniqueSlug(title);
        const board = await prisma.board.create({
            data: { userId, title, slug, description, gridData: {}, settings: {} },
        });

        logger.info(`Board created: ${board.id} by user ${userId}`);
        return board;
    }

    async getUserBoards(userId: string): Promise<Board[]> {
        return prisma.board.findMany({
            where: {
                OR: [
                    { userId },
                    { collaborators: { some: { userId, acceptedAt: { not: null } } } },
                ],
            },
            orderBy: { updatedAt: 'desc' },
            include: { _count: { select: { sections: true, postits: true, collaborators: true } } },
        });
    }

    async getBoardById(boardId: string, userId: string): Promise<Board | null> {
        const board = await prisma.board.findFirst({
            where: {
                id: boardId,
                OR: [
                    { userId },
                    { collaborators: { some: { userId, acceptedAt: { not: null } } } },
                ],
            },
            include: { sections: { include: { postits: true } }, teamMembers: true },
        });

        if (board) {
            await prisma.board.update({ where: { id: boardId }, data: { lastAccessedAt: new Date() } });
        }

        return board;
    }

    async getBoardBySlug(slug: string, userId?: string): Promise<Board | null> {
        return prisma.board.findFirst({
            where: {
                slug,
                OR: userId
                    ? [
                        { userId },
                        { isPublic: true },
                        { collaborators: { some: { userId, acceptedAt: { not: null } } } },
                    ]
                    : [{ isPublic: true }],
            },
            include: { sections: { include: { postits: true } }, teamMembers: true },
        });
    }

    async updateBoard(boardId: string, userId: string, data: Partial<Board> & { expectedVersion?: number }): Promise<Board> {
        const hasPermission = await checkBoardPermission(boardId, userId, 'edit');
        if (!hasPermission) throw new Error('Unauthorized to update this board');

        const currentBoard = await prisma.board.findUnique({ where: { id: boardId }, select: { version: true } });
        if (!currentBoard) throw new Error('Board not found');

        const { expectedVersion, id, userId: uid, createdAt, updatedAt, ...safeData } = data as any;

        if (expectedVersion !== undefined && currentBoard.version !== expectedVersion) {
            const error = new Error('Board has been modified by another user. Please refresh and try again.');
            (error as any).statusCode = 409;
            (error as any).currentVersion = currentBoard.version;
            throw error;
        }

        const board = await prisma.$transaction(async (tx) => {
            const boardInTx = await tx.board.findUnique({ where: { id: boardId }, select: { version: true } });

            if (expectedVersion !== undefined && boardInTx?.version !== expectedVersion) {
                const error = new Error('Board has been modified by another user. Please refresh and try again.');
                (error as any).statusCode = 409;
                (error as any).currentVersion = boardInTx?.version;
                throw error;
            }

            return tx.board.update({
                where: { id: boardId },
                data: { ...safeData, version: { increment: 1 }, updatedAt: new Date() },
            });
        });

        logger.info(`Board updated: ${boardId} by user ${userId} (version: ${board.version})`);
        return board;
    }

    async deleteBoard(boardId: string, userId: string): Promise<void> {
        const board = await prisma.board.findFirst({ where: { id: boardId, userId } });
        if (!board) throw new Error('Board not found or unauthorized');
        await prisma.board.delete({ where: { id: boardId } });
        logger.info(`Board deleted: ${boardId} by user ${userId}`);
    }

    async shareBoard(boardId: string, currentUserId: string, email: string): Promise<void> {
        const board = await prisma.board.findUnique({ where: { id: boardId }, include: { user: true } });
        if (!board) throw new Error('Board not found');
        if (board.userId !== currentUserId) throw new Error('Only the board owner can share it');

        const userToShareWith = await prisma.user.findUnique({ where: { email } });
        if (userToShareWith) {
            await prisma.boardCollaborator.upsert({
                where: { boardId_userId: { boardId, userId: userToShareWith.id } },
                update: { permission: 'edit' },
                create: { boardId, userId: userToShareWith.id, permission: 'edit', invitedBy: currentUserId, acceptedAt: new Date() },
            });
        }

        const boardUrl = `${config.frontend.url}/board.html?id=${boardId}`;
        await sendInviteEmail(email, boardUrl, '', board.user.name ?? '');
        logger.info(`Board ${boardId} shared with ${email} by user ${currentUserId}`);
    }
}

export default new BoardService();
