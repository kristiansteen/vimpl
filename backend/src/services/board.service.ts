import prisma from '../config/database';
import { Board, Section, Postit } from '@prisma/client';
import logger from '../utils/logger';

class BoardService {
  /**
   * Create a unique slug from title
   */
  private async generateUniqueSlug(title: string, userId: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists
    while (await prisma.board.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Create a new board
   */
  async createBoard(
    userId: string,
    title: string,
    description?: string
  ): Promise<Board> {
    // Import subscription service
    const subscriptionService = (await import('./subscription.service')).default;
    
    // Check if user can create a new board based on their subscription
    const { allowed, reason } = await subscriptionService.canCreateBoard(userId);
    
    if (!allowed) {
      throw new Error(reason || 'Cannot create board');
    }

    const slug = await this.generateUniqueSlug(title, userId);

    const board = await prisma.board.create({
      data: {
        userId,
        title,
        slug,
        description,
        gridData: {},
        settings: {},
      },
    });

    logger.info(`Board created: ${board.id} by user ${userId}`);

    return board;
  }

  /**
   * Get all boards for a user
   */
  async getUserBoards(userId: string): Promise<Board[]> {
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { userId },
          {
            collaborators: {
              some: {
                userId,
                acceptedAt: { not: null },
              },
            },
          },
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        _count: {
          select: {
            sections: true,
            postits: true,
            collaborators: true,
          },
        },
      },
    });

    return boards;
  }

  /**
   * Get a board by ID
   */
  async getBoardById(boardId: string, userId: string): Promise<Board | null> {
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { userId },
          {
            collaborators: {
              some: {
                userId,
                acceptedAt: { not: null },
              },
            },
          },
        ],
      },
      include: {
        sections: {
          include: {
            postits: true,
          },
        },
        teamMembers: true,
      },
    });

    if (board) {
      // Update last accessed
      await prisma.board.update({
        where: { id: boardId },
        data: { lastAccessedAt: new Date() },
      });
    }

    return board;
  }

  /**
   * Get board by slug
   */
  async getBoardBySlug(slug: string, userId?: string): Promise<Board | null> {
    const board = await prisma.board.findFirst({
      where: {
        slug,
        OR: userId
          ? [
              { userId },
              { isPublic: true },
              {
                collaborators: {
                  some: {
                    userId,
                    acceptedAt: { not: null },
                  },
                },
              },
            ]
          : [{ isPublic: true }],
      },
      include: {
        sections: {
          include: {
            postits: true,
          },
        },
        teamMembers: true,
      },
    });

    return board;
  }

  /**
   * Update a board
   */
  async updateBoard(
    boardId: string,
    userId: string,
    data: Partial<Board>
  ): Promise<Board> {
    // Check ownership or edit permission
    const hasPermission = await this.checkBoardPermission(boardId, userId, 'edit');

    if (!hasPermission) {
      throw new Error('Unauthorized to update this board');
    }

    const board = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    logger.info(`Board updated: ${boardId} by user ${userId}`);

    return board;
  }

  /**
   * Delete a board
   */
  async deleteBoard(boardId: string, userId: string): Promise<void> {
    // Only owner can delete
    const board = await prisma.board.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new Error('Board not found or unauthorized');
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    logger.info(`Board deleted: ${boardId} by user ${userId}`);
  }

  /**
   * Check if user has permission on a board
   */
  async checkBoardPermission(
    boardId: string,
    userId: string,
    requiredPermission: 'view' | 'edit' | 'admin'
  ): Promise<boolean> {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        collaborators: {
          where: {
            userId,
            acceptedAt: { not: null },
          },
        },
      },
    });

    if (!board) {
      return false;
    }

    // Owner has all permissions
    if (board.userId === userId) {
      return true;
    }

    // Public boards allow view permission
    if (board.isPublic && requiredPermission === 'view') {
      return true;
    }

    // Check collaborator permission
    const collaborator = board.collaborators[0];
    if (!collaborator) {
      return false;
    }

    const permissionLevels = {
      view: 1,
      edit: 2,
      admin: 3,
    };

    return (
      permissionLevels[collaborator.permission as keyof typeof permissionLevels] >=
      permissionLevels[requiredPermission]
    );
  }

  /**
   * Create a section in a board
   */
  async createSection(
    boardId: string,
    userId: string,
    sectionData: Omit<Section, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>
  ): Promise<Section> {
    const hasPermission = await this.checkBoardPermission(boardId, userId, 'edit');

    if (!hasPermission) {
      throw new Error('Unauthorized to create section');
    }

    const section = await prisma.section.create({
      data: {
        ...sectionData,
        boardId,
      },
    });

    return section;
  }

  /**
   * Update a section
   */
  async updateSection(
    sectionId: string,
    userId: string,
    data: Partial<Section>
  ): Promise<Section> {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { board: true },
    });

    if (!section) {
      throw new Error('Section not found');
    }

    const hasPermission = await this.checkBoardPermission(
      section.boardId,
      userId,
      'edit'
    );

    if (!hasPermission) {
      throw new Error('Unauthorized to update section');
    }

    return prisma.section.update({
      where: { id: sectionId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a section
   */
  async deleteSection(sectionId: string, userId: string): Promise<void> {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { board: true },
    });

    if (!section) {
      throw new Error('Section not found');
    }

    const hasPermission = await this.checkBoardPermission(
      section.boardId,
      userId,
      'edit'
    );

    if (!hasPermission) {
      throw new Error('Unauthorized to delete section');
    }

    await prisma.section.delete({
      where: { id: sectionId },
    });
  }

  /**
   * Create a post-it
   */
  async createPostit(
    boardId: string,
    userId: string,
    postitData: Omit<Postit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Postit> {
    const hasPermission = await this.checkBoardPermission(boardId, userId, 'edit');

    if (!hasPermission) {
      throw new Error('Unauthorized to create post-it');
    }

    const postit = await prisma.postit.create({
      data: postitData,
    });

    return postit;
  }

  /**
   * Update a post-it
   */
  async updatePostit(
    postitId: string,
    userId: string,
    data: Partial<Postit>
  ): Promise<Postit> {
    const postit = await prisma.postit.findUnique({
      where: { id: postitId },
    });

    if (!postit) {
      throw new Error('Post-it not found');
    }

    const hasPermission = await this.checkBoardPermission(postit.boardId, userId, 'edit');

    if (!hasPermission) {
      throw new Error('Unauthorized to update post-it');
    }

    return prisma.postit.update({
      where: { id: postitId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a post-it
   */
  async deletePostit(postitId: string, userId: string): Promise<void> {
    const postit = await prisma.postit.findUnique({
      where: { id: postitId },
    });

    if (!postit) {
      throw new Error('Post-it not found');
    }

    const hasPermission = await this.checkBoardPermission(postit.boardId, userId, 'edit');

    if (!hasPermission) {
      throw new Error('Unauthorized to delete post-it');
    }

    await prisma.postit.delete({
      where: { id: postitId },
    });
  }
}

export default new BoardService();
