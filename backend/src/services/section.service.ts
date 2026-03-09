import prisma from '../config/database';
import { Section } from '@prisma/client';
import { checkBoardPermission } from './board.service';

export async function createSection(
    boardId: string,
    userId: string,
    sectionData: Omit<Section, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>
): Promise<Section> {
    const hasPermission = await checkBoardPermission(boardId, userId, 'edit');
    if (!hasPermission) throw new Error('Unauthorized to create section');

    return prisma.section.create({ data: { ...(sectionData as any), boardId } });
}

export async function updateSection(
    sectionId: string,
    userId: string,
    data: Partial<Section>
): Promise<Section> {
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) throw new Error('Section not found');

    const hasPermission = await checkBoardPermission(section.boardId, userId, 'edit');
    if (!hasPermission) throw new Error('Unauthorized to update section');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, boardId, createdAt, updatedAt, ...safeData } = data;
    return prisma.section.update({ where: { id: sectionId }, data: { ...(safeData as any), updatedAt: new Date() } });
}

export async function deleteSection(sectionId: string, userId: string): Promise<void> {
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) throw new Error('Section not found');

    const hasPermission = await checkBoardPermission(section.boardId, userId, 'edit');
    if (!hasPermission) throw new Error('Unauthorized to delete section');

    await prisma.section.delete({ where: { id: sectionId } });
}
