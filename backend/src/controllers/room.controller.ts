import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';
import { AllocationStatus } from '@prisma/client';

const allocateSchema = z.object({
  studentId: z.number(),
  roomId: z.number(),
  bedId: z.number(),
  notes: z.string().optional(),
});

const autoAllocateSchema = z.object({
  studentId: z.number(),
  roomType: z.enum(['AC', 'NON_AC']),
});

export const getRooms = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        floor: {
          include: {
            building: {
              include: { hostel: true },
            },
          },
        },
        beds: {
          include: {
            students: {
              include: {
                user: {
                  select: { username: true, email: true },
                },
              },
            },
          },
        },
        students: true,
      },
    });

    res.status(200).json({
      status: 'success',
      rooms,
    });
  } catch (err) {
    next(err);
  }
};

export const allocateRoomManual = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, roomId, bedId, notes } = allocateSchema.parse(req.body);

    // Validate bed availability
    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
    });

    if (!bed || bed.isOccupied) {
      return next(new AppError('The selected bed is already occupied or does not exist.', 400));
    }

    // Allocate bed to student
    const allocation = await prisma.$transaction(async (tx) => {
      // Mark bed as occupied
      await tx.bed.update({
        where: { id: bedId },
        data: { isOccupied: true },
      });

      // Update student record
      await tx.student.update({
        where: { id: studentId },
        data: { roomId, bedId },
      });

      // Create allocation record
      return tx.roomAllocation.create({
        data: {
          studentId,
          roomId,
          bedId,
          allocatedBy: req.user?.id || 1,
          status: AllocationStatus.ALLOCATED,
          notes,
        },
      });
    });

    res.status(201).json({
      status: 'success',
      message: 'Room manual allocation complete.',
      allocation,
    });
  } catch (err) {
    next(err);
  }
};

export const allocateRoomAuto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, roomType } = autoAllocateSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return next(new AppError('Student profile not found.', 404));
    }

    if (student.roomId) {
      return next(new AppError('Student is already allocated to a room.', 400));
    }

    // Find first vacant bed in requested room type
    const vacantBed = await prisma.bed.findFirst({
      where: {
        isOccupied: false,
        room: {
          type: roomType,
        },
      },
      include: { room: true },
    });

    if (!vacantBed) {
      return next(new AppError(`No vacant ${roomType} beds available in the system.`, 404));
    }

    const allocation = await prisma.$transaction(async (tx) => {
      await tx.bed.update({
        where: { id: vacantBed.id },
        data: { isOccupied: true },
      });

      await tx.student.update({
        where: { id: studentId },
        data: {
          roomId: vacantBed.roomId,
          bedId: vacantBed.id,
        },
      });

      return tx.roomAllocation.create({
        data: {
          studentId,
          roomId: vacantBed.roomId,
          bedId: vacantBed.id,
          allocatedBy: req.user?.id || 1,
          status: AllocationStatus.ALLOCATED,
          notes: 'Auto allocated by system.',
        },
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Automatic allocation successful.',
      allocation,
    });
  } catch (err) {
    next(err);
  }
};

export const deallocateRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || !student.roomId || !student.bedId) {
      return next(new AppError('Student has no current room allocation.', 400));
    }

    await prisma.$transaction(async (tx) => {
      // Mark bed as free
      await tx.bed.update({
        where: { id: student.bedId! },
        data: { isOccupied: false },
      });

      // Update allocation logs
      await tx.roomAllocation.updateMany({
        where: {
          studentId,
          status: AllocationStatus.ALLOCATED,
        },
        data: {
          status: AllocationStatus.VACATED,
          vacatedAt: new Date(),
        },
      });

      // Clear room allocation fields on student
      await tx.student.update({
        where: { id: studentId },
        data: { roomId: null, bedId: null },
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Room deallocated successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const allocateRoomWarden = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, roomId, bedNumber } = req.body;

    let student = await prisma.student.findUnique({
      where: { id: isNaN(Number(studentId)) ? -1 : Number(studentId) },
    });

    if (!student) {
      // Fallback search by Roll No
      student = await prisma.student.findUnique({
        where: { rollNo: String(studentId) },
      });
    }

    if (!student) {
      return next(new AppError('Student record not found.', 404));
    }

    // Try to find a bed in the room matching the bedNumber
    let bed = await prisma.bed.findFirst({
      where: {
        roomId: Number(roomId),
        number: String(bedNumber),
      },
    });

    if (!bed) {
      bed = await prisma.bed.findFirst({
        where: {
          roomId: Number(roomId),
          number: { contains: String(bedNumber) },
        },
      });
    }

    if (!bed) {
      return next(new AppError(`Bed "${bedNumber}" not found in this room.`, 404));
    }

    if (bed.isOccupied) {
      return next(new AppError('The selected bed is already occupied.', 400));
    }

    // Deallocate previous room if any
    if (student.bedId) {
      await prisma.bed.update({
        where: { id: student.bedId },
        data: { isOccupied: false },
      });
      await prisma.roomAllocation.updateMany({
        where: {
          studentId: student.id,
          status: AllocationStatus.ALLOCATED,
        },
        data: {
          status: AllocationStatus.VACATED,
          vacatedAt: new Date(),
        },
      });
    }

    // Allocate bed to student
    const allocation = await prisma.$transaction(async (tx) => {
      // Mark bed as occupied
      await tx.bed.update({
        where: { id: bed.id },
        data: { isOccupied: true },
      });

      // Update student record
      await tx.student.update({
        where: { id: student.id },
        data: { roomId: Number(roomId), bedId: bed.id },
      });

      // Create allocation record
      return tx.roomAllocation.create({
        data: {
          studentId: student.id,
          roomId: Number(roomId),
          bedId: bed.id,
          allocatedBy: req.user?.id || 1,
          status: AllocationStatus.ALLOCATED,
        },
      });
    });

    res.status(201).json({
      status: 'success',
      message: 'Room manual allocation complete.',
      allocation,
    });
  } catch (err) {
    next(err);
  }
};
