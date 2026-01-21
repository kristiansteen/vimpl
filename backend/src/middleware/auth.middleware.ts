import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import logger from '../utils/logger';

export interface AuthRequest extends Request<any, any, any, any> {
  user?: {
    userId: string;
    email: string;
  };
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
 * Optional authentication - doesn't fail if token is missing/invalid
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
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
