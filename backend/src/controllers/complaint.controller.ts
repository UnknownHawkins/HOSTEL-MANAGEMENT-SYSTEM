import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';
import { ComplaintStatus } from '@prisma/client';
import { aiService } from '../services/ai.service';

const createComplaintSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
});

const updateComplaintSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  assignedStaff: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

export const createComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.roleName !== 'STUDENT') {
      return next(new AppError('Only students can lodge complaints.', 403));
    }

    const { title, description, category, imageUrl } = createComplaintSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!student) {
      return next(new AppError('Student profile not found.', 404));
    }

    // Auto-classify category using AI if not provided
    let finalCategory = category || 'Other';
    if (!category) {
      try {
        finalCategory = await aiService.classifyComplaint(title, description);
      } catch (err) {
        // Fallback silently
      }
    }

    const complaint = await prisma.complaint.create({
      data: {
        studentId: student.id,
        title,
        description,
        category: finalCategory,
        imageUrl,
        status: ComplaintStatus.OPEN,
      },
    });

    // Notify Warden
    await prisma.notification.create({
      data: {
        userId: req.user.id, // Or alert warden
        title: 'New Complaint Filed',
        message: `New complaint filed: "${title}" classified as [${finalCategory}].`,
        type: 'COMPLAINT',
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Complaint submitted successfully.',
      complaint,
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentComplaints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.roleName !== 'STUDENT') {
      return next(new AppError('Unauthorized.', 403));
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!student) {
      return next(new AppError('Student profile not found.', 404));
    }

    const complaints = await prisma.complaint.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      complaints,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllComplaints = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        student: {
          include: {
            user: { select: { username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      complaints,
    });
  } catch (err) {
    next(err);
  }
};

export const updateComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = parseInt(req.params.id);
    const { status, assignedStaff, resolutionNotes } = updateComplaintSchema.parse(req.body);

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { student: true },
    });

    if (!complaint) {
      return next(new AppError('Complaint ticket not found.', 404));
    }

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: status as ComplaintStatus,
        assignedStaff,
        resolutionNotes,
      },
    });

    // Notify student of ticket updates
    await prisma.notification.create({
      data: {
        userId: complaint.student.userId,
        title: `Complaint Ticket Updated`,
        message: `Your complaint "${complaint.title}" is now [${status.toLowerCase()}].${
          assignedStaff ? ` Assigned to: ${assignedStaff}.` : ''
        }`,
        type: 'COMPLAINT',
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Complaint ticket updated.',
      complaint: updated,
    });
  } catch (err) {
    next(err);
  }
};
