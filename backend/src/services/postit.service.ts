import prisma from '../config/database';
import { Postit } from '@prisma/client';
import { checkBoardPermission } from './board.service';

export async function createPostit(
    boardId: string,
    userId: string,
    postitData: Omit<Postit, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Postit> {
    const hasPermission = await checkBoardPermission(boardId, userId, 'edit');
    if (!hasPermission) throw new Error('Unauthorized to create post-it');

    return prisma.postit.create({ data: postitData });
}

export async function updatePostit(
    postitId: string,
    userId: string,
    data: Partial<Postit>
): Promise<Postit> {
    const postit = await prisma.postit.findUnique({ where: { id: postitId } });
    if (!postit) throw new Error('Post-it not found');

    const hasPermission = await checkBoardPermission(postit.boardId, userId, 'edit');
    if (!hasPermission) throw new Error('Unauthorized to update post-it');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, boardId, sectionId, createdAt, updatedAt, ...safeData } = data;
    return prisma.postit.update({ where: { id: postitId }, data: { ...safeData, updatedAt: new Date() } });
}

export async function deletePostit(postitId: string, userId: string): Promise<void> {
    const postit = await prisma.postit.findUnique({ where: { id: postitId } });
    if (!postit) throw new Error('Post-it not found');

    const hasPermission = await checkBoardPermission(postit.boardId, userId, 'edit');
    if (!hasPermission) throw new Error('Unauthorized to delete post-it');

    await prisma.postit.delete({ where: { id: postitId } });
}
