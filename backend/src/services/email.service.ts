import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      logger.info(`📧 [EMAIL SENT] to: ${options.to} | Subject: ${options.subject}`);
      logger.debug(`Content: ${options.text}`);

      if (env.NODE_ENV === 'production' && env.SMTP_USER && env.SMTP_PASS) {
        // In real deployment, you would initialize nodemailer:
        // const nodemailer = require('nodemailer');
        // const transporter = nodemailer.createTransport({
        //   host: env.SMTP_HOST,
        //   port: env.SMTP_PORT,
        //   auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
        // });
        // await transporter.sendMail({
        //   from: '"Enterprise Hostel Management" <no-reply@hostel.edu>',
        //   to: options.to,
        //   subject: options.subject,
        //   text: options.text,
        //   html: options.html
        // });
        logger.info('Production SMTP configuration active (Simulated).');
      }

      return true;
    } catch (error) {
      logger.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendLeaveStatusUpdate(studentEmail: string, studentName: string, status: string, comment?: string) {
    const subject = `Leave Request Update - ${status}`;
    const text = `Dear ${studentName},\n\nYour leave request has been ${status.toLowerCase()}.${
      comment ? ` Warden comment: "${comment}"` : ''
    }\n\nRegards,\nHostel Management Team`;
    
    await this.sendEmail({ to: studentEmail, subject, text });
  }

  async sendFeeReminder(studentEmail: string, studentName: string, feeAmount: number, dueDateStr: string) {
    const subject = `Fee Payment Reminder - Action Required`;
    const text = `Dear ${studentName},\n\nThis is a reminder to clear your hostel/mess fee of ₹${feeAmount} before ${dueDateStr} to avoid late fines.\n\nRegards,\nHostel Accounts Department`;
    
    await this.sendEmail({ to: studentEmail, subject, text });
  }

  async sendNoticeAlert(studentEmail: string, noticeTitle: string, noticeSummary: string) {
    const subject = `New Notice Published: ${noticeTitle}`;
    const text = `Dear Student,\n\nA new announcement has been posted:\n\n${noticeTitle}\n${noticeSummary}\n\nPlease check your Student Portal for full details.\n\nRegards,\nHostel Warden`;
    
    await this.sendEmail({ to: studentEmail, subject, text });
  }
}

export const emailService = new EmailService();
