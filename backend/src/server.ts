import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import config from './config';
import logger from './utils/logger';
import prisma from './config/database';

// Import routes
import authRoutes from './routes/auth.routes';
import boardRoutes from './routes/board.routes';
import portfolioRoutes from './routes/portfolio.routes';
import subscriptionRoutes from './routes/subscription.routes';
import adminRoutes from './routes/admin.routes';

import { configureGoogleStrategy } from './auth/googleAuth';

// Initialize Passport Strategies
configureGoogleStrategy();

const app: Express = express();

// Trust proxy (for Railway, Render, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is allowed
    const allowedOrigins = config.frontend.allowedOrigins;
    // Also allow the configured frontend URL explicitly if it's not in the allowedOrigins list
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin === config.frontend.url) {
      callback(null, true);
    } else {
      logger.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

// Root route - Welcome message
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'vimpl API is running',
    version: '1.0.0',
    documentation: '/docs',
    health: '/health'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/boards', boardRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);

  const statusCode = (err as any).statusCode || 500;
  const message = config.nodeEnv === 'development' ? err.message : 'Internal server error';

  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const PORT = config.port;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
      logger.info(`📍 API available at http://localhost:${PORT}/api/v1`);
      logger.info(`💚 Health check at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
