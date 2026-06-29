import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { redisClient } from './utils/redis';
import { prisma } from './utils/prisma';
import jwt from 'jsonwebtoken';

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Store socket connection references
const activeConnections = new Map<number, string>(); // userId -> socketId

io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  if (!token || typeof token !== 'string') {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    (socket as any).userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  if (userId) {
    activeConnections.set(userId, socket.id);
    socket.join(`user_${userId}`);
    logger.info(`🔌 Socket connected: User ID ${userId} (Socket: ${socket.id})`);
  }

  socket.on('disconnect', () => {
    if (userId) {
      activeConnections.delete(userId);
      logger.info(`🔌 Socket disconnected: User ID ${userId}`);
    }
  });
});

// Helper: Broadcast dynamic real-time notifications to targeted users
export const emitNotification = (userId: number, payload: { title: string; message: string; type: string }) => {
  io.to(`user_${userId}`).emit('notification', payload);
  logger.debug(`💬 Emitted real-time notification to user ${userId}: ${payload.title}`);
};

const bootstrap = async () => {
  try {
    // 1. Connect Redis Cache
    await redisClient.connect();

    // 2. Validate DB Connection Uptime
    await prisma.$connect();
    logger.info('📊 Connected to Neon/PostgreSQL database successfully.');

    // 3. Start Express Server
    server.listen(env.PORT, () => {
      logger.info(`🚀 EHMS Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error('❌ EHMS Server failed to start:', err);
    process.exit(1);
  }
};

// Graceful Shutdown Handler
const shutdown = async () => {
  logger.warn('🔌 Shutdown signal received. Closing connections...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database disconnected.');
    await redisClient.quit().catch(() => {});
    logger.info('Cache client closed.');
    process.exit(0);
  });

  // Timeout shutdown if hanging
  setTimeout(() => {
    logger.error('Force shutting down due to timeout...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

bootstrap();
