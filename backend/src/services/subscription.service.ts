import prisma from '../config/database';
import { User } from '@prisma/client';
import logger from '../utils/logger';

export const SUBSCRIPTION_TIERS = {
  STUDENT: {
    id: 'student',
    name: 'Student',
    price: 0,
    boardLimit: 1,
    features: [
      '1 planning board',
      'All section types',
      'Unlimited post-its',
      'Export to JSON',
      'Basic support'
    ]
  },
  COMMERCIAL: {
    id: 'commercial',
    name: 'Commercial',
    price: 9,
    boardLimit: null, // unlimited
    features: [
      'Unlimited planning boards',
      'Portfolio dashboard',
      'All section types',
      'Unlimited post-its',
      'Export to JSON',
      'Board sharing',
      'Priority support',
      'Advanced analytics'
    ]
  }
} as const;

class SubscriptionService {
  /**
   * Get subscription tier details
   */
  getTierDetails(tier: string) {
    return tier === 'commercial' ? SUBSCRIPTION_TIERS.COMMERCIAL : SUBSCRIPTION_TIERS.STUDENT;
  }

  /**
   * Check if user can create a new board
   */
  async canCreateBoard(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { boards: true }
        }
      }
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    const tier = this.getTierDetails(user.subscriptionTier);
    
    // Commercial tier has unlimited boards
    if (tier.boardLimit === null) {
      return { allowed: true };
    }

    // Check if user has reached their board limit
    if (user._count.boards >= tier.boardLimit) {
      return {
        allowed: false,
        reason: `You have reached the maximum number of boards (${tier.boardLimit}) for the ${tier.name} plan. Upgrade to Commercial for unlimited boards.`
      };
    }

    return { allowed: true };
  }

  /**
   * Get user's board count and limit
   */
  async getUserBoardStats(userId: string): Promise<{
    currentBoards: number;
    boardLimit: number | null;
    canCreateMore: boolean;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { boards: true }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tier = this.getTierDetails(user.subscriptionTier);
    const currentBoards = user._count.boards;
    const boardLimit = tier.boardLimit;
    const canCreateMore = boardLimit === null || currentBoards < boardLimit;

    return {
      currentBoards,
      boardLimit,
      canCreateMore
    };
  }

  /**
   * Upgrade user to commercial tier
   */
  async upgradeToCommercial(userId: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'commercial',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        // Set end date to 1 month from now
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    logger.info(`User ${userId} upgraded to commercial tier`);

    return user;
  }

  /**
   * Downgrade user to student tier
   */
  async downgradeToStudent(userId: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'student',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date()
      }
    });

    logger.info(`User ${userId} downgraded to student tier`);

    return user;
  }

  /**
   * Check if subscription is active
   */
  async isSubscriptionActive(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return false;
    }

    // Student tier is always active
    if (user.subscriptionTier === 'student') {
      return true;
    }

    // Check commercial subscription status and end date
    if (user.subscriptionStatus !== 'active') {
      return false;
    }

    if (user.subscriptionEndDate && user.subscriptionEndDate < new Date()) {
      // Subscription expired, downgrade to student
      await this.downgradeToStudent(userId);
      return false;
    }

    return true;
  }

  /**
   * Get all users with subscription details
   */
  async getAllSubscriptions() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        createdAt: true,
        _count: {
          select: { boards: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

export default new SubscriptionService();
