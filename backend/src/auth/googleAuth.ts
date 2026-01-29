import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import config from '../config';
import logger from '../utils/logger';

/**
 * Configure Passport with Google Strategy
 */
export const configureGoogleStrategy = () => {
    if (!config.google.clientId || !config.google.clientSecret) {
        logger.warn('Google OAuth not configured - missing client ID or secret in environment variables');
        return;
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID: config.google.clientId,
                clientSecret: config.google.clientSecret,
                callbackURL: config.google.callbackUrl,
                passReqToCallback: true,
            },
            async (req: any, _accessToken: string, _refreshToken: string, profile: any, done: any) => {
                try {
                    const ipAddress = req.ip;
                    const userAgent = req.get('User-Agent');

                    logger.info(`Google OAuth callback received for profile: ${profile.id} (${profile.emails?.[0]?.value})`);

                    const user = await authService.findOrCreateGoogleUser(profile, ipAddress, userAgent);
                    done(null, { userId: user.id, email: user.email });
                } catch (error) {
                    logger.error('Google OAuth error during user creation/lookup:', error);
                    done(error as Error, undefined);
                }
            }
        )
    );

    // Serialize user (required by Passport even if we use JWT)
    passport.serializeUser((user: any, done) => {
        done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
        done(null, user);
    });
};

/**
 * Middleware to initiate Google Login
 */
export const googleLogin = (req: Request, res: Response, next: NextFunction) => {
    if (!config.google.clientId || !config.google.clientSecret) {
        res.status(503).json({
            error: 'Service Unavailable',
            message: 'Google Login is not configured on the server.',
        });
        return;
    }

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        prompt: 'select_account', // Force account selection
    })(req, res, next);
};

/**
 * Middleware to handle Google Callback
 */
export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${config.frontend.url}/login?error=google_auth_failed`,
    }, (err: any, user: any, _info: any) => {
        if (err) {
            logger.error('Google Passport authentication error:', err);
            return res.redirect(`${config.frontend.url}/login?error=google_auth_error`);
        }

        if (!user) {
            logger.warn('Google Passport authentication failed - no user returned');
            return res.redirect(`${config.frontend.url}/login?error=google_auth_failed`);
        }

        // Attach user to request for the controller
        req.user = user;
        next();
    })(req, res, next);
};
