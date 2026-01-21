import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import authService from '../services/auth.service';
import config from '../config';
import logger from '../utils/logger';

// Google OAuth Strategy
if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await authService.findOrCreateGoogleUser(profile);
          done(null, { userId: user.id, email: user.email });
        } catch (error) {
          logger.error('Google OAuth error:', error);
          done(error as Error, undefined);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth not configured - missing client ID or secret');
}

// Serialize user (not needed for JWT but required by Passport)
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
