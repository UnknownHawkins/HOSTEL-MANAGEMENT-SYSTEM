import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { generalLimiter } from './middlewares/rate-limit.middleware';
import { logger } from './utils/logger';

// Import Routes
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';
import leaveRoutes from './routes/leave.routes';
import complaintRoutes from './routes/complaint.routes';
import visitorRoutes from './routes/visitor.routes';
import paymentRoutes from './routes/payment.routes';
import noticeRoutes from './routes/notice.routes';
import attendanceRoutes from './routes/attendance.routes';
import adminRoutes from './routes/admin.routes';
import aiRoutes from './routes/ai.routes';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: true, // Allow dynamically reflecting origin for ease of use
    credentials: true,
  })
);

// Body and Cookie Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Inline Cookie Parser (Avoid extra dependency)
app.use((req: any, _res: any, next: any) => {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie: string) => {
      const parts = cookie.split('=');
      const name = parts.shift()?.trim() || '';
      list[name] = decodeURI(parts.join('='));
    });
  }
  req.cookies = list;
  next();
});

// Logging Integration
const morganFormat = env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// General Rate Limiter
app.use(generalLimiter);

// API Documentation (Swagger Stub)
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Enterprise Hostel Management System (EHMS) API',
    version: '1.0.0',
    description: 'Relational REST API backend powering dashboards for wardens, students, and administrators.',
  },
  servers: [{ url: '/api/v1' }],
  paths: {},
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/visitors', visitorRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ai', aiRoutes);

// Test Route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'success', message: 'EHMS Server Online.' });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
