import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';
import { VisitorStatus } from '@prisma/client';

const registerVisitorSchema = z.object({
  name: z.string().min(2),
  contactNo: z.string().min(10),
  purpose: z.string().min(3),
  studentRollNo: z.string(),
});

const verifyOtpSchema = z.object({
  visitorId: z.number(),
  otp: z.string(),
});

export const registerVisitor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, contactNo, purpose, studentRollNo } = registerVisitorSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { rollNo: studentRollNo },
    });

    if (!student) {
      return next(new AppError('No student found with that roll number.', 404));
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const qrCode = `EHMS-VISITOR-${Date.now()}-${Math.random().toString(36).substring(3, 7).toUpperCase()}`;

    const visitor = await prisma.visitor.create({
      data: {
        name,
        contactNo,
        purpose,
        studentId: student.id,
        otp,
        qrCode,
        status: VisitorStatus.PENDING,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Visitor pass pre-registered. Provide OTP to verify entrance.',
      visitor: {
        id: visitor.id,
        name: visitor.name,
        qrCode: visitor.qrCode,
        otp, // Shared in API response for demo/mock ease
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyVisitorEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitorId, otp } = verifyOtpSchema.parse(req.body);

    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitor) {
      return next(new AppError('Visitor record not found.', 404));
    }

    if (visitor.otp !== otp) {
      return next(new AppError('Invalid verification OTP.', 400));
    }

    const updated = await prisma.visitor.update({
      where: { id: visitorId },
      data: {
        isOtpVerified: true,
        entryTime: new Date(),
        status: VisitorStatus.APPROVED,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Visitor entry verified. Entry timestamp recorded.',
      visitor: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const recordVisitorExit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitorId = parseInt(req.params.id);

    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitor || !visitor.isOtpVerified) {
      return next(new AppError('Visitor entry has not been verified yet.', 400));
    }

    const updated = await prisma.visitor.update({
      where: { id: visitorId },
      data: {
        exitTime: new Date(),
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Visitor exit recorded successfully.',
      visitor: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const getVisitorLogs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.visitor.findMany({
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
      logs,
    });
  } catch (err) {
    next(err);
  }
};

export const getVisitorsWarden = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.visitor.findMany({
      include: {
        student: {
          include: {
            user: { select: { username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const visitors = logs.map((v) => ({
      id: v.id,
      visitorName: v.name,
      relation: v.purpose.split(' - ')[0] || 'Parent',
      contactNumber: v.contactNo,
      purpose: v.purpose.split(' - ').slice(1).join(' - ') || v.purpose,
      checkInTime: v.entryTime || v.createdAt,
      checkOutTime: v.exitTime,
      student: v.student,
    }));

    res.status(200).json({
      status: 'success',
      visitors,
    });
  } catch (err) {
    next(err);
  }
};

export const checkInVisitorWarden = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, visitorName, relation, contactNumber, purpose } = req.body;

    let student = await prisma.student.findUnique({
      where: { id: isNaN(Number(studentId)) ? -1 : Number(studentId) },
    });

    if (!student) {
      student = await prisma.student.findUnique({
        where: { rollNo: String(studentId) },
      });
    }

    if (!student) {
      return next(new AppError('Student not found with target ID or Roll No.', 404));
    }

    const visitor = await prisma.visitor.create({
      data: {
        name: visitorName,
        contactNo: contactNumber,
        purpose: `${relation} - ${purpose}`,
        studentId: student.id,
        isOtpVerified: true,
        entryTime: new Date(),
        status: VisitorStatus.APPROVED,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Visitor checked in successfully.',
      visitor,
    });
  } catch (err) {
    next(err);
  }
};

export const checkOutVisitorWarden = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitorId = parseInt(req.params.id);

    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitor) {
      return next(new AppError('Visitor not found.', 404));
    }

    const updated = await prisma.visitor.update({
      where: { id: visitorId },
      data: {
        exitTime: new Date(),
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Visitor checked out successfully.',
      visitor: updated,
    });
  } catch (err) {
    next(err);
  }
};
