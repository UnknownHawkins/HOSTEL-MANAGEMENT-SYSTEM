import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

const markAttendanceSchema = z.object({
  studentId: z.number(),
  date: z.string().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'LEAVE']),
});

export const markAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, date, status } = markAttendanceSchema.parse(req.body);

    const recordDate = date ? new Date(date) : new Date();
    // Normalize date to start of day
    recordDate.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        studentId,
        date: {
          gte: recordDate,
          lt: new Date(recordDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    let record;
    if (existing) {
      record = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: status as AttendanceStatus,
          markedBy: req.user?.id || 1,
        },
      });
    } else {
      record = await prisma.attendance.create({
        data: {
          studentId,
          date: recordDate,
          status: status as AttendanceStatus,
          markedBy: req.user?.id || 1,
        },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Attendance record saved.',
      record,
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user?.id },
    });

    if (!student) {
      return next(new AppError('Student record not found.', 404));
    }

    const logs = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      logs,
    });
  } catch (err) {
    next(err);
  }
};

export const getHostelAttendance = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.attendance.findMany({
      include: {
        student: {
          include: {
            user: { select: { username: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      logs,
    });
  } catch (err) {
    next(err);
  }
};
