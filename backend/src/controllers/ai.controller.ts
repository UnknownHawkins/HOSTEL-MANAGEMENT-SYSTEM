import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.string(),
    text: z.string(),
  })).optional(),
});

const riskAnalysisSchema = z.object({
  studentName: z.string(),
  attendanceRate: z.coerce.number(),
  pendingComplaintsCount: z.coerce.number(),
  leavesCount: z.coerce.number(),
});

export const askAiAssistant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history } = chatSchema.parse(req.body);
    const reply = await aiService.chatAssistant(message, history || []);
    res.status(200).json({
      status: 'success',
      reply,
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentRiskAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentName, attendanceRate, pendingComplaintsCount, leavesCount } = riskAnalysisSchema.parse(req.body);
    
    const analysis = await aiService.summarizeStudentRisk(
      studentName,
      attendanceRate,
      pendingComplaintsCount,
      leavesCount
    );

    res.status(200).json({
      status: 'success',
      analysis,
    });
  } catch (err) {
    next(err);
  }
};
