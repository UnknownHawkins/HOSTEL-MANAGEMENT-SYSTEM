import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class AIService {
  private ai: any = null;
  private isEnabled: boolean = false;

  constructor() {
    if (env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        this.isEnabled = true;
        logger.info('🤖 Gemini AI Service initialized successfully.');
      } catch (err) {
        logger.error('❌ Failed to initialize Gemini AI SDK:', err);
      }
    } else {
      logger.warn('⚠️ GEMINI_API_KEY is not defined. AI features will run in Mock mode.');
    }
  }

  private async generate(prompt: string, fallback: string): Promise<string> {
    if (!this.isEnabled || !this.ai) {
      logger.debug(`AI running in mock mode. Returning fallback for prompt length: ${prompt.length}`);
      return fallback;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || fallback;
    } catch (err) {
      logger.error('❌ Error calling Gemini API:', err);
      return fallback;
    }
  }

  // 1. AI Hostel Assistant (Chat)
  async chatAssistant(userMessage: string, history: { role: string; text: string }[] = []): Promise<string> {
    const contextPrompt = `You are EHMS Assistant, an AI designed for college hostel students and wardens. 
Answer queries about room allocations, leave rules, complaint processes, and mess bills politely and professionally.
Keep your answers brief, informative, and structured.

Conversation history:
${history.map(h => `${h.role}: ${h.text}`).join('\n')}
User: ${userMessage}
Assistant:`;

    const mockResponse = `I am EHMS AI Assistant. Regarding your question: "${userMessage}", standard hostel rules require students to submit leave applications 48 hours in advance. For plumbing or electrical complaints, you can file a ticket in the Complaints desk which our warden normally assigns within 24 hours. Let me know if you need help filing a leave request or complaint!`;

    return this.generate(contextPrompt, mockResponse);
  }

  // 2. Complaint Classification
  async classifyComplaint(title: string, description: string): Promise<string> {
    const prompt = `Classify the following hostel complaint into exactly one of these categories: "Plumbing", "Electrical", "Housekeeping", "Wifi/Network", "Furniture", "Other". 
Return only the category name, nothing else.

Complaint Title: ${title}
Description: ${description}
Category:`;

    // Local basic text analysis for mock fallback
    const text = (title + ' ' + description).toLowerCase();
    let mockCategory = 'Other';
    if (text.includes('leak') || text.includes('water') || text.includes('tap') || text.includes('pipe') || text.includes('plumb')) {
      mockCategory = 'Plumbing';
    } else if (text.includes('light') || text.includes('fan') || text.includes('bulb') || text.includes('switch') || text.includes('wire') || text.includes('power') || text.includes('fuse')) {
      mockCategory = 'Electrical';
    } else if (text.includes('wifi') || text.includes('internet') || text.includes('router') || text.includes('lan') || text.includes('network') || text.includes('connection')) {
      mockCategory = 'Wifi/Network';
    } else if (text.includes('dirt') || text.includes('clean') || text.includes('sweep') || text.includes('trash') || text.includes('waste') || text.includes('dust')) {
      mockCategory = 'Housekeeping';
    } else if (text.includes('bed') || text.includes('chair') || text.includes('table') || text.includes('desk') || text.includes('cupboard') || text.includes('closet')) {
      mockCategory = 'Furniture';
    }

    return this.generate(prompt, mockCategory);
  }

  // 3. Leave Recommendation
  async evaluateLeaveRisk(
    studentName: string, 
    rollNo: string, 
    leaveDays: number, 
    reason: string, 
    pastLeavesCount: number
  ): Promise<{ risk: 'LOW' | 'MEDIUM' | 'HIGH'; recommendation: 'APPROVE' | 'REVIEW'; explanation: string }> {
    
    const prompt = `Analyze a student leave application and assess the risk of approval.
Student: ${studentName} (Roll: ${rollNo})
Number of days: ${leaveDays}
Reason: ${reason}
Past leaves approved this semester: ${pastLeavesCount}

Return your assessment in JSON format with fields:
- "risk": "LOW" | "MEDIUM" | "HIGH"
- "recommendation": "APPROVE" | "REVIEW"
- "explanation": "detailed reason in one sentence"`;

    let mockRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let mockRec: 'APPROVE' | 'REVIEW' = 'APPROVE';
    let mockExp = 'Reasonable leave duration and low frequency of prior leaves.';

    if (leaveDays > 7 || reason.toLowerCase().includes('vacation') || pastLeavesCount > 5) {
      mockRisk = 'MEDIUM';
      mockRec = 'REVIEW';
      mockExp = 'Leave request exceeds a week or student has taken multiple leaves this term. Requires warden inspection.';
    }
    if (leaveDays > 15 && pastLeavesCount > 8) {
      mockRisk = 'HIGH';
      mockRec = 'REVIEW';
      mockExp = 'Suspiciously high leave duration and frequency. Potential risk of attendance shortage.';
    }

    const fallbackString = JSON.stringify({ risk: mockRisk, recommendation: mockRec, explanation: mockExp });
    const result = await this.generate(prompt, fallbackString);

    try {
      // Find JSON block if AI outputs markdown formatting
      const jsonStart = result.indexOf('{');
      const jsonEnd = result.lastIndexOf('}') + 1;
      const cleanJson = result.substring(jsonStart, jsonEnd);
      return JSON.parse(cleanJson);
    } catch (e) {
      return { risk: mockRisk, recommendation: mockRec, explanation: mockExp };
    }
  }

  // 4. Student Risk & Summary Analysis
  async summarizeStudentRisk(
    studentName: string,
    attendanceRate: number,
    pendingComplaintsCount: number,
    leavesCount: number
  ): Promise<string> {
    const prompt = `Generate a risk summary and general analysis for the following hostel resident:
Student Name: ${studentName}
Attendance Rate: ${attendanceRate}%
Pending Complaints Filed: ${pendingComplaintsCount}
Total Leave Requests Taken: ${leavesCount}

Structure the analysis with a rating (Good/Warning/Critical) and a brief paragraph.`;

    let mockSummary = `Resident ${studentName} maintains excellent standing with ${attendanceRate}% attendance. Under supervision, there are no structural risks, and leave patterns are within normal academic limits.`;
    if (attendanceRate < 75 || leavesCount > 6) {
      mockSummary = `⚠️ WARNING: Student ${studentName} has a low attendance rate of ${attendanceRate}% and has requested ${leavesCount} leaves. There is an increased risk of failing term attendance requirements. Recommended for counseling.`;
    }

    return this.generate(prompt, mockSummary);
  }
}

export const aiService = new AIService();
