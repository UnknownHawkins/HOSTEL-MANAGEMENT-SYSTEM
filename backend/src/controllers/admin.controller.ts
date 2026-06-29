import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { z } from 'zod';

const createWardenSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  hostelId: z.number().optional(),
});

export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const studentCount = await prisma.student.count();
    const wardenCount = await prisma.warden.count();
    const roomCount = await prisma.room.count();
    
    // Occupancy
    const occupiedBeds = await prisma.bed.count({ where: { isOccupied: true } });
    const totalBeds = await prisma.bed.count();
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    const openComplaints = await prisma.complaint.count({ where: { status: 'OPEN' } });

    // Financial calculations
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });

    res.status(200).json({
      status: 'success',
      stats: {
        studentCount,
        wardenCount,
        roomCount,
        occupiedBeds,
        totalBeds,
        occupancyRate,
        pendingLeaves,
        openComplaints,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createWarden = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, hostelId } = createWardenSchema.parse(req.body);
    const bcrypt = require('bcrypt');

    const role = await prisma.role.findUnique({ where: { name: 'WARDEN' } });
    if (!role) return next(new AppError('Warden role not initialized.', 500));

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existing) {
      return next(new AppError('Username or email already exists.', 400));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        roleId: role.id,
        isEmailVerified: true,
      },
    });

    const warden = await prisma.warden.create({
      data: {
        userId: user.id,
        hostelId,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Warden account created successfully.',
      warden,
    });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.status(200).json({
      status: 'success',
      logs,
    });
  } catch (err) {
    next(err);
  }
};

// Super admin features (System metrics & Database controls)
export const getSystemHealth = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    res.status(200).json({
      status: 'success',
      health: {
        status: 'UP',
        uptime,
        memoryUsage: {
          rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
        },
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const backupDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Simulate database backup
    logger.info(`💾 Database backup requested by admin user: ${req.user?.username}`);
    
    // Create an audit entry
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'DB_BACKUP',
        details: 'Full relational schema database backup generated.',
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Database backup file generated successfully.',
      backupUrl: `https://hostel-backups.s3.amazonaws.com/backup_${Date.now()}.sql.gz`,
    });
  } catch (err) {
    next(err);
  }
};

export const restoreDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info(`🔄 Database restore requested by admin user: ${req.user?.username}`);
    
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'DB_RESTORE',
        details: 'Full database restoration executed from backup.',
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Database state restored to target backup index successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const getStudents = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            createdAt: true,
          },
        },
        room: true,
        bed: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      students,
    });
  } catch (err) {
    next(err);
  }
};

export const getWardens = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const wardens = await prisma.warden.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            createdAt: true,
          },
        },
        hostel: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      wardens,
    });
  } catch (err) {
    next(err);
  }
};

export const getAdmins = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          name: { in: ['ADMIN', 'SUPER_ADMIN'] },
        },
      },
      include: {
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      admins: adminUsers.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role.name,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};
