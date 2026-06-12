import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import prisma from '../config/database';
import logger from '../utils/logger';

import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export interface AuthRequest extends Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>> {
  user?: any;
}

function extractToken(req: AuthRequest): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.substring(7);
  return req.cookies?.accessToken;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized', message: 'No authentication token provided' });
      return;
    }

    const payload = authService.verifyAccessToken(token);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
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

export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = authService.verifyAccessToken(token);
      req.user = { userId: payload.userId, email: payload.email };
    } catch {
      logger.debug('Optional auth - invalid token');
    }
  }
  next();
};
