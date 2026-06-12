import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import prisma from '../config/database';
import logger from '../utils/logger';

// Import necessary types for compatibility
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export interface AuthRequest extends Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>> {
  user?: any;
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
      return;
    }

    // Verify token
    const payload = authService.verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Requires the authenticated user to be an admin (isAdmin flag or ADMIN_EMAILS env var).
 * Must be used after `authenticate`.
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
      return;
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

    let isAdmin = adminEmails.includes(req.user.email);
    if (!isAdmin) {
      const u = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { isAdmin: true } });
      isAdmin = u?.isAdmin ?? false;
    }

    if (!isAdmin) {
      res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
      return;
    }

    next();
  } catch (error) {
    res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }
};

/**
 * Optional authentication - doesn't fail if token is missing/invalid
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (token) {
      try {
        const payload = authService.verifyAccessToken(token);
        req.user = {
          userId: payload.userId,
          email: payload.email,
        };
      } catch (error) {
        // Ignore token errors for optional auth
        logger.debug('Optional auth - invalid token');
      }
    }

    next();
  } catch (error) {
    next();
  }
};
