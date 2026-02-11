import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import lyricsRoutes from './routes/lyrics.js';
import exportRoutes from './routes/export.js';
import templateRoutes from './routes/templates.js';
import youtubeRoutes from './routes/youtube.js';
import audioRoutes from './routes/audio.js';
import mediaRoutes from './routes/media.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import and start worker
import { exportWorker } from './workers/exportWorker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, '../../.env') });

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any localhost in development
      if (NODE_ENV === 'development') {
        if (!origin || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      } else {
        // Production: Only allow specified frontend URL
        const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
        callback(null, origin === allowedOrigin);
      }
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/media', mediaRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🎵 Lyric Video Generator API                   ║
  ║                                                   ║
  ║   Environment: ${NODE_ENV.padEnd(33)}║
  ║   Port: ${PORT.toString().padEnd(42)}║
  ║   URL: http://localhost:${PORT.toString().padEnd(26)}║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  // Close worker
  await exportWorker.close();
  console.log('Worker closed');

  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
