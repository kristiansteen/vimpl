import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import logger from '../utils/logger';

// Type definition for Request with User
export interface AuthRequest extends Request {
    user?: any;
}

/**
 * Middleware to authenticate JWT token
 * Checks Authorization header (Bearer) and cookies
 */
export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        // 1. Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        // 2. Check cookies (if you use httpOnly cookies)
        else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'No authentication token provided',
            });
            return;
        }

        // Verify token
        try {
            const payload = authService.verifyAccessToken(token);

            // Attach minimal user info to request
            req.user = {
                userId: payload.userId,
                email: payload.email,
            };

            next();
        } catch (tokenError) {
            // Token expired or invalid
            logger.warn(`Authentication failed: Invalid token - ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token',
                code: 'TOKEN_INVALID' // Client can use this to try refresh flow
            });
        }

    } catch (error) {
        logger.error('Authentication middleware error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred during authentication'
        });
    }
};
