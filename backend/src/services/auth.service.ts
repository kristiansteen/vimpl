import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import prisma from '../config/database';
import config from '../config';
import logger from '../utils/logger';

const SALT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Register a new user with email and password
   */
  async register(email: string, password: string, name?: string): Promise<User> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create verification token
    const verificationToken = jwt.sign({ email }, config.jwt.secret, { expiresIn: '24h' } as jwt.SignOptions);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split('@')[0],
        authProvider: 'email',
        verificationToken,
      },
    });

    logger.info(`New user registered: ${email}`);

    // TODO: Send verification email
    // await this.sendVerificationEmail(user.email, verificationToken);

    return user;
  }

  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const loginAuditService = (await import('./login-audit.service')).default;

    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.passwordHash) {
        await loginAuditService.logLogin({
          email,
          loginMethod: 'email',
          success: false,
          ipAddress,
          userAgent,
          errorMessage: 'Invalid credentials'
        });
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        await loginAuditService.logLogin({
          userId: user.id,
          email,
          loginMethod: 'email',
          success: false,
          ipAddress,
          userAgent,
          errorMessage: 'Account is inactive'
        });
        throw new Error('Account is inactive');
      }

      // Verify password
      const isValidPassword = await this.comparePassword(password, user.passwordHash);

      if (!isValidPassword) {
        await loginAuditService.logLogin({
          userId: user.id,
          email,
          loginMethod: 'email',
          success: false,
          ipAddress,
          userAgent,
          errorMessage: 'Invalid credentials'
        });
        throw new Error('Invalid credentials');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Log successful login
      await loginAuditService.logLogin({
        userId: user.id,
        email,
        loginMethod: 'email',
        success: true,
        ipAddress,
        userAgent
      });

      // Generate tokens
      const tokens = this.generateTokens(user);

      logger.info(`User logged in: ${email}`);

      return { user, tokens };
    } catch (error) {
      // If we haven't logged the failure yet, log it now
      if (error instanceof Error && error.message === 'Invalid credentials') {
        throw error;
      }

      await loginAuditService.logLogin({
        email,
        loginMethod: 'email',
        success: false,
        ipAddress,
        userAgent,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Find or create user from Google OAuth
   */
  async findOrCreateGoogleUser(
    profile: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    const loginAuditService = (await import('./login-audit.service')).default;
    const email = profile.emails[0].value;
    const googleId = profile.id;

    try {
      // Try to find existing user
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Update Google ID if not set
        if (!user.authProviderId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              authProviderId: googleId,
              authProvider: 'google',
            },
          });
        }
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            authProvider: 'google',
            authProviderId: googleId,
            emailVerified: true, // Google emails are verified
            subscriptionTier: 'student', // Default to student tier
            subscriptionStatus: 'active'
          },
        });

        logger.info(`New user created from Google OAuth: ${email}`);
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Log successful login
      await loginAuditService.logLogin({
        userId: user.id,
        email,
        loginMethod: 'google',
        success: true,
        ipAddress,
        userAgent
      });

      return user;
    } catch (error) {
      // Log failed login
      await loginAuditService.logLogin({
        email,
        loginMethod: 'google',
        success: false,
        ipAddress,
        userAgent,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    const payload = this.verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new access token
    return this.generateAccessToken({
      userId: user.id,
      email: user.email,
    });
  }

  /**
   * Verify email with verification token
   */
  async verifyEmail(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as { email: string };

      const user = await prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.emailVerified) {
        throw new Error('Email already verified');
      }

      // Mark email as verified
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
        },
      });

      logger.info(`Email verified: ${user.email}`);

      return updatedUser;
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Get user without sensitive data
   */
  sanitizeUser(user: User): Omit<User, 'passwordHash' | 'verificationToken' | 'resetPasswordToken' | 'resetPasswordExpires'> {
    const { passwordHash, verificationToken, resetPasswordToken, resetPasswordExpires, ...sanitized } = user;
    return sanitized;
  }
}

export default new AuthService();
