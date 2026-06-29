import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = null;

  // Log error
  logger.error(`${err.name}: ${err.message}\nStack: ${err.stack}`);

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError' || err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation Error';
    details = (err as any).errors || (err as any).format?.();
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  } else if ((err as any).code === 'P2002') {
    // Prisma Unique Constraint violation
    statusCode = 409;
    message = 'A record with this unique attribute already exists.';
    details = (err as any).meta?.target;
  } else if ((err as any).code === 'P2025') {
    // Prisma Record not found
    statusCode = 404;
    message = 'Requested record not found.';
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
