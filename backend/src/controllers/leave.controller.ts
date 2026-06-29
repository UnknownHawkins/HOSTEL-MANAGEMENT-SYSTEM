import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';
import { LeaveStatus } from '@prisma/client';
import { emailService } from '../services/email.service';
import { aiService } from '../services/ai.service';

const leaveApplySchema = z.object({
  days: z.coerce.number().min(1),
  reason: z.string().min(5),
  startDate: z.string(),
  endDate: z.string(),
  documentUrl: z.string().optional(),
});

const leaveReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
});

export const applyLeave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.roleName !== 'STUDENT') {
      return next(new AppError('Only students can apply for leaves.', 403));
    }

    const { days, reason, startDate, endDate, documentUrl } = leaveApplySchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!student) {
      return next(new AppError('Student record not found.', 404));
    }

    // Run AI Risk evaluation before storing or returning
    let aiAssessment = null;
    try {
      const pastLeavesCount = await prisma.leaveRequest.count({
        where: { studentId: student.id, status: LeaveStatus.APPROVED },
      });

      aiAssessment = await aiService.evaluateLeaveRisk(
        req.user.username,
        student.rollNo,
        days,
        reason,
        pastLeavesCount
      );
    } catch (e) {
      // Graceful fallback
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        studentId: student.id,
        days,
        reason,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        documentUrl,
        status: LeaveStatus.PENDING,
      },
    });

    // Push notification to warden
    await prisma.notification.create({
      data: {
        userId: req.user.id, // Notification linked to the applicant or target wardens
        title: 'New Leave Application',
        message: `${req.user.username} applied for ${days} days leave. Reason: ${reason}. Risk recommendation: ${aiAssessment?.recommendation || 'REVIEW'}.`,
        type: 'LEAVE',
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Leave application submitted successfully.',
      leave,
      aiAssessment,
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentLeaves = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.roleName !== 'STUDENT') {
      return next(new AppError('Only students can access this route.', 403));
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!student) {
      return next(new AppError('Student record not found.', 404));
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      leaves,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllLeaves = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        student: {
          include: {
            user: { select: { username: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      leaves,
    });
  } catch (err) {
    next(err);
  }
};

export const reviewLeave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaveId = parseInt(req.params.id);
    const { status, comment } = leaveReviewSchema.parse(req.body);

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: {
        student: {
          include: {
            user: { select: { username: true, email: true } },
          },
        },
      },
    });

    if (!leave) {
      return next(new AppError('Leave request not found.', 404));
    }

    if (leave.status !== LeaveStatus.PENDING) {
      return next(new AppError('Leave request has already been reviewed.', 400));
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: status as LeaveStatus,
        wardenComment: comment,
        approvedBy: req.user?.id,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 1,
        action: `LEAVE_${status}`,
        details: `Leave ID ${leaveId} was ${status.toLowerCase()} by ${req.user?.username}`,
      },
    });

    // Notify student (In-app notification)
    await prisma.notification.create({
      data: {
        userId: leave.student.userId,
        title: `Leave Request ${status}`,
        message: `Your leave request has been ${status.toLowerCase()}.${
          comment ? ` Warden comment: ${comment}` : ''
        }`,
        type: 'LEAVE',
      },
    });

    // Send Email
    await emailService.sendLeaveStatusUpdate(
      leave.student.user.email,
      leave.student.user.username,
      status,
      comment
    );

    res.status(200).json({
      status: 'success',
      message: `Leave request has been ${status.toLowerCase()}.`,
      leave: updatedLeave,
    });
  } catch (err) {
    next(err);
  }
};
