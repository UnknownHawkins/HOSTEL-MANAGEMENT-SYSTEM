import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Validators
const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(4),
  role: z.enum(['student', 'warden', 'admin']).default('student'),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const profileSetupSchema = z.object({
  name: z.string().min(2),
  rollNo: z.string(),
  parentPhone: z.string(),
  address: z.string(),
});

// Helper: Generate tokens
const generateTokens = (user: { id: number; username: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, username: user.username },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// Helper: Set cookie options
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, role } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return next(new AppError('Username or email already exists.', 400));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Fetch matching role ID
    const dbRoleName = role.toUpperCase();
    const dbRole = await prisma.role.findUnique({
      where: { name: dbRoleName },
    });

    if (!dbRole) {
      return next(new AppError('Role not found in system database.', 500));
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        roleId: dbRole.id,
      },
    });

    // Create subprofile
    if (dbRoleName === 'STUDENT') {
      // Create empty student profile - must be completed in profile setup
      await prisma.student.create({
        data: {
          userId: user.id,
          rollNo: `TEMP_${Date.now()}`,
          parentPhone: '',
          address: '',
        },
      });
    } else if (dbRoleName === 'WARDEN') {
      await prisma.warden.create({
        data: { userId: user.id },
      });
    } else if (dbRoleName === 'ADMIN') {
      await prisma.admin.create({
        data: { userId: user.id },
      });
    }

    logger.info(`👤 User registered: ${username} (${role})`);

    res.status(201).json({
      status: 'success',
      message: `User '${username}' registered. Please proceed to login.`,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: { permissions: true },
        },
        studentProfile: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next(new AppError('Invalid username or password.', 401));
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Store session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
        device: req.headers['user-agent'],
      },
    });

    // Set Cookies
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15m
    });

    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });

    logger.info(`🔑 User logged in: ${username}`);

    const isFirstLogin = user.role.name === 'STUDENT' ? user.studentProfile?.isFirstLogin : false;

    res.status(200).json({
      status: 'success',
      token: accessToken,
      isFirstLogin,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions.map((p) => p.name),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const setupStudentProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.roleName !== 'STUDENT') {
      return next(new AppError('Only students can perform profile setup.', 403));
    }

    const { name, rollNo, parentPhone, address } = profileSetupSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!student) {
      return next(new AppError('Student record not found.', 404));
    }

    // Update profile
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        rollNo,
        parentPhone,
        address,
        isFirstLogin: false,
      },
    });

    // Update User audit log or name
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PROFILE_SETUP',
        details: `Student profile completed for ${name}. Roll: ${rollNo}`,
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Student profile completed successfully.',
      student: updatedStudent,
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refresh_token || req.body.refreshToken;

    if (!token) {
      return next(new AppError('Refresh token required.', 401));
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;

    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return next(new AppError('Session expired or invalid.', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    const tokens = generateTokens(user);

    // Refresh cookie
    res.cookie('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      status: 'success',
      token: tokens.accessToken,
    });
  } catch (err) {
    next(new AppError('Invalid refresh token.', 401));
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refresh_token || req.body.refreshToken;

    if (token) {
      await prisma.session.delete({ where: { token } }).catch(() => {});
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: {
          include: {
            room: {
              include: {
                floor: true,
              },
            },
            bed: true,
          },
        },
        wardenProfile: {
          include: { hostel: true },
        },
      },
    });

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: req.user.roleName,
        permissions: req.user.permissions,
        profile: req.user.roleName === 'STUDENT' ? user.studentProfile : user.wardenProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new AppError('Current and new password are required.', 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return next(new AppError('Invalid current password.', 400));
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGE',
        details: 'User updated their account password.',
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};
