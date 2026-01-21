import prisma from '../config/database';
import { LoginAudit } from '@prisma/client';
import logger from '../utils/logger';

interface LoginAuditData {
  userId?: string;
  email: string;
  loginMethod: 'email' | 'google';
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
}

class LoginAuditService {
  /**
   * Log a login attempt
   */
  async logLogin(data: LoginAuditData): Promise<LoginAudit> {
    const audit = await prisma.loginAudit.create({
      data: {
        userId: data.userId,
        email: data.email,
        loginMethod: data.loginMethod,
        success: data.success,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        errorMessage: data.errorMessage
      }
    });

    logger.info(
      `Login ${data.success ? 'successful' : 'failed'}: ${data.email} via ${data.loginMethod}`
    );

    return audit;
  }

  /**
   * Get all login audits with optional filters
   */
  async getLoginAudits(filters?: {
    userId?: string;
    email?: string;
    success?: boolean;
    loginMethod?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<LoginAudit[]> {
    const where: any = {};

    if (filters) {
      if (filters.userId) where.userId = filters.userId;
      if (filters.email) where.email = filters.email;
      if (filters.success !== undefined) where.success = filters.success;
      if (filters.loginMethod) where.loginMethod = filters.loginMethod;
      
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }
    }

    const audits = await prisma.loginAudit.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: filters?.limit || 1000,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            subscriptionTier: true
          }
        }
      }
    });

    return audits;
  }

  /**
   * Get login audits for a specific user
   */
  async getUserLoginHistory(userId: string, limit: number = 50): Promise<LoginAudit[]> {
    return prisma.loginAudit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get login statistics
   */
  async getLoginStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalLogins,
      successfulLogins,
      failedLogins,
      emailLogins,
      googleLogins,
      uniqueUsers
    ] = await Promise.all([
      prisma.loginAudit.count({ where }),
      prisma.loginAudit.count({ where: { ...where, success: true } }),
      prisma.loginAudit.count({ where: { ...where, success: false } }),
      prisma.loginAudit.count({ where: { ...where, loginMethod: 'email' } }),
      prisma.loginAudit.count({ where: { ...where, loginMethod: 'google' } }),
      prisma.loginAudit.findMany({
        where,
        distinct: ['userId'],
        select: { userId: true }
      })
    ]);

    return {
      totalLogins,
      successfulLogins,
      failedLogins,
      emailLogins,
      googleLogins,
      uniqueUsers: uniqueUsers.filter(u => u.userId !== null).length,
      successRate: totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0
    };
  }

  /**
   * Export all login audits as JSON
   */
  async exportAllLogins(): Promise<any[]> {
    const audits = await prisma.loginAudit.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            subscriptionTier: true
          }
        }
      }
    });

    // Format for export
    return audits.map(audit => ({
      id: audit.id,
      userId: audit.userId,
      email: audit.email,
      userName: audit.user?.name || null,
      subscriptionTier: audit.user?.subscriptionTier || null,
      loginMethod: audit.loginMethod,
      success: audit.success,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      errorMessage: audit.errorMessage,
      timestamp: audit.createdAt.toISOString()
    }));
  }

  /**
   * Clean up old login audits (optional, for data retention)
   */
  async cleanupOldAudits(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await prisma.loginAudit.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${result.count} old login audit records`);

    return result.count;
  }
}

export default new LoginAuditService();
