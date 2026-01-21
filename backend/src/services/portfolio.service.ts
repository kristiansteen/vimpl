import prisma from '../config/database';
import logger from '../utils/logger';

export interface BoardHighlights {
  boardId: string;
  boardTitle: string;
  boardSlug: string;
  lastAccessed: Date;
  totalSections: number;
  totalPostits: number;
  postitsByStatus: {
    todo: number;
    inprogress: number;
    done: number;
  };
  recentActivity: {
    created: number;
    updated: number;
  };
  teamMemberCount: number;
  hasRiskMatrix: boolean;
  highRiskItems: number;
}

export interface PortfolioDashboard {
  user: {
    id: string;
    name: string | null;
    email: string;
    subscriptionTier: string;
  };
  summary: {
    totalBoards: number;
    totalPostits: number;
    totalSections: number;
    completionRate: number;
    activeBoards: number;
  };
  boards: BoardHighlights[];
}

class PortfolioService {
  /**
   * Get portfolio stats
   */
  async getPortfolioStats() {
    // Placeholder implementation
    return {
      totalBoards: await prisma.board.count(),
      totalSections: await prisma.section.count(),
      totalPostits: await prisma.postit.count(),
    };
  }

  /**
   * Get portfolio dashboard for a user
   */
  async getPortfolioDashboard(userId: string): Promise<PortfolioDashboard> {
    // Get user with boards
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        boards: {
          include: {
            sections: true,
            postits: true,
            teamMembers: true,
            _count: {
              select: {
                sections: true,
                postits: true,
                teamMembers: true
              }
            }
          },
          orderBy: {
            lastAccessedAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate board highlights
    const boardHighlights: BoardHighlights[] = await Promise.all(
      user.boards.map(async (board) => {
        const postits = board.postits;

        // Count post-its by status
        const postitsByStatus = {
          todo: postits.filter(p => p.status === 'todo').length,
          inprogress: postits.filter(p => p.status === 'inprogress').length,
          done: postits.filter(p => p.status === 'done').length
        };

        // Check for risk matrix sections
        const hasRiskMatrix = board.sections.some(s => s.type === 'matrix');

        // Count high risk items (risk score > 7500)
        const highRiskItems = postits.filter(p =>
          p.riskScore !== null && p.riskScore > 7500
        ).length;

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentCreated = postits.filter(p => p.createdAt > sevenDaysAgo).length;
        const recentUpdated = postits.filter(p => p.updatedAt > sevenDaysAgo && p.createdAt < sevenDaysAgo).length;

        return {
          boardId: board.id,
          boardTitle: board.title,
          boardSlug: board.slug,
          lastAccessed: board.lastAccessedAt,
          totalSections: board._count.sections,
          totalPostits: board._count.postits,
          postitsByStatus,
          recentActivity: {
            created: recentCreated,
            updated: recentUpdated
          },
          teamMemberCount: board._count.teamMembers,
          hasRiskMatrix,
          highRiskItems
        };
      })
    );

    // Calculate summary statistics
    const totalPostits = boardHighlights.reduce((sum, b) => sum + b.totalPostits, 0);
    const totalSections = boardHighlights.reduce((sum, b) => sum + b.totalSections, 0);
    const totalDone = boardHighlights.reduce((sum, b) => sum + b.postitsByStatus.done, 0);
    const completionRate = totalPostits > 0 ? (totalDone / totalPostits) * 100 : 0;

    // Active boards are those accessed in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeBoards = boardHighlights.filter(b => b.lastAccessed > thirtyDaysAgo).length;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier
      },
      summary: {
        totalBoards: user.boards.length,
        totalPostits,
        totalSections,
        completionRate: Math.round(completionRate),
        activeBoards
      },
      boards: boardHighlights
    };
  }

  /**
   * Get board comparison data
   */
  async getBoardComparison(userId: string): Promise<any> {
    const dashboard = await this.getPortfolioDashboard(userId);

    return {
      boards: dashboard.boards.map(board => ({
        title: board.boardTitle,
        slug: board.boardSlug,
        metrics: {
          totalItems: board.totalPostits,
          completionRate: board.totalPostits > 0
            ? Math.round((board.postitsByStatus.done / board.totalPostits) * 100)
            : 0,
          teamSize: board.teamMemberCount,
          recentActivity: board.recentActivity.created + board.recentActivity.updated,
          highRiskItems: board.highRiskItems
        }
      })),
      averages: {
        completionRate: dashboard.summary.completionRate,
        itemsPerBoard: Math.round(dashboard.summary.totalPostits / dashboard.summary.totalBoards),
        sectionsPerBoard: Math.round(dashboard.summary.totalSections / dashboard.summary.totalBoards)
      }
    };
  }

  /**
   * Get recent activity across all boards
   */
  async getRecentActivity(userId: string, limit: number = 20) {
    const events = await prisma.eventLog.findMany({
      where: {
        userId,
        board: {
          userId
        }
      },
      include: {
        board: {
          select: {
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return events.map(event => ({
      id: event.id,
      type: event.eventType,
      boardTitle: event.board.title,
      boardSlug: event.board.slug,
      elementType: event.elementType,
      timestamp: event.createdAt
    }));
  }
}

export default new PortfolioService();
