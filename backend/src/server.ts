import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import config from './config';
import logger from './utils/logger';
import prisma from './config/database';
import swaggerSpec from './config/swagger';

// Import routes
import authRoutes from './routes/auth.routes';
import boardRoutes from './routes/board.routes';
import portfolioRoutes from './routes/portfolio.routes';
import subscriptionRoutes from './routes/subscription.routes';
import adminRoutes from './routes/admin.routes';
import eventlogRoutes from './routes/eventlog.routes';
import leadRoutes from './routes/lead.routes';

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
    const allowedOrigins = config.frontend.allowedOrigins.map(o => o.toLowerCase());
    const lowerOrigin = origin.toLowerCase().replace(/\/+$/, '');

    // Check main list, wildcards, or any vercel.app subdomain
    if (
      allowedOrigins.includes(lowerOrigin) ||
      allowedOrigins.includes('*') ||
      lowerOrigin === config.frontend.url.toLowerCase() ||
      lowerOrigin.endsWith('.vercel.app')
    ) {
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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

// Swagger API Documentation (vimpl branded)
const swaggerCss = `
  .swagger-ui .topbar { background: linear-gradient(135deg, #3d7a1f 0%, #65c434 100%); }
  .swagger-ui .topbar .download-url-wrapper .select-label select { border-color: #65c434; }
  .swagger-ui .info .title { color: #3d7a1f; }
  .swagger-ui .btn.authorize { color: #65c434; border-color: #65c434; }
  .swagger-ui .btn.authorize svg { fill: #65c434; }
  .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #65c434; }
  .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #3d7a1f; }
  .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #0ea5e9; }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #ef4444; }
  .swagger-ui .scheme-container { background: #f8faf6; border-bottom: 2px solid #a3e085; }
`;

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: swaggerCss,
  customSiteTitle: 'vimpl API Documentation',
  customfavIcon: '',
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// Serve raw OpenAPI spec as JSON
app.get('/docs/spec.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/boards', boardRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/boards/:boardId/eventlog', eventlogRoutes);
app.use('/api/v1/leads', leadRoutes);

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
