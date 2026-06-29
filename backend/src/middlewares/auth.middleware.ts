import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../utils/prisma';
import { AppError } from './error.middleware';

export interface UserPayload {
  id: number;
  username: string;
  roleId: number;
  roleName: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token = '';

    // Check header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check cookie
    else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    // Fetch user and check if active session exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Assign to req.user
    req.user = {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: user.role.permissions.map((p) => p.name),
    };

    next();
  } catch (err) {
    next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
};

// RBAC Role Guard
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }

    next();
  };
};

// Permission-based Guard
export const requirePermission = (permission: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // SUPER_ADMIN gets a bypass for all permissions
    if (req.user.roleName === 'SUPER_ADMIN') {
      return next();
    }

    if (!req.user.permissions.includes(permission)) {
      return next(new AppError('Access denied. Required permission: ' + permission, 403));
    }

    next();
  };
};
