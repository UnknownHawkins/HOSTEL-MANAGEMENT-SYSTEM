import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { NoticeTarget } from '@prisma/client';

const createNoticeSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'WARDENS']).default('ALL'),
});

export const getNotices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roleName = req.user?.roleName || 'STUDENT';
    
    // Filters notices by audience scope
    const audienceFilter: NoticeTarget[] = ['ALL'];
    if (roleName === 'STUDENT') audienceFilter.push('STUDENTS');
    if (roleName === 'WARDEN' || roleName === 'ADMIN' || roleName === 'SUPER_ADMIN') {
      audienceFilter.push('WARDENS');
      audienceFilter.push('STUDENTS');
    }

    const notices = await prisma.notice.findMany({
      where: {
        targetAudience: { in: audienceFilter },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      notices,
    });
  } catch (err) {
    next(err);
  }
};

export const createNotice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, targetAudience } = createNoticeSchema.parse(req.body);

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        targetAudience: targetAudience as NoticeTarget,
        createdBy: req.user?.id || 1,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Announcement notice published successfully.',
      notice,
    });
  } catch (err) {
    next(err);
  }
};
