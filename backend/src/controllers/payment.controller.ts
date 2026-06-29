import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';
import { PaymentStatus, PaymentType } from '@prisma/client';
import { env } from '../config/env';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { logger } from '../utils/logger';

const createPaymentSchema = z.object({
  type: z.enum(['FEES', 'MESS', 'ELECTRICITY', 'FINE']),
  amount: z.coerce.number().positive(),
  gateway: z.enum(['STRIPE', 'RAZORPAY']),
});

const completePaymentSchema = z.object({
  paymentId: z.number(),
  status: z.enum(['PAID', 'FAILED']),
  transactionId: z.string(),
});

// Setup payment clients conditionally
let stripe: Stripe | null = null;
let razorpay: Razorpay | null = null;

if (env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' as any });
}
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.roleName !== 'STUDENT') {
      return next(new AppError('Only students can initialize fee payments.', 403));
    }

    const { type, amount, gateway } = createPaymentSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!student) {
      return next(new AppError('Student record not found.', 404));
    }

    // 1. Log pending payment in database
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        type: type as PaymentType,
        amount,
        status: PaymentStatus.PENDING,
        provider: gateway,
      },
    });

    let clientSecret = '';
    let orderId = '';
    let isMock = true;

    // 2. Stripe integration
    if (gateway === 'STRIPE' && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // in cents
          currency: 'inr',
          metadata: { paymentId: payment.id.toString(), studentId: student.id.toString() },
        });
        clientSecret = paymentIntent.client_secret || '';
        isMock = false;
      } catch (err) {
        logger.error('Stripe error, falling back to mock payment:', err);
      }
    } 
    // 3. Razorpay integration
    else if (gateway === 'RAZORPAY' && razorpay) {
      try {
        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100), // in paise
          currency: 'INR',
          receipt: `receipt_payment_${payment.id}`,
        });
        orderId = order.id;
        isMock = false;
      } catch (err) {
        logger.error('Razorpay error, falling back to mock payment:', err);
      }
    }

    res.status(201).json({
      status: 'success',
      paymentId: payment.id,
      amount: payment.amount,
      gateway,
      isMock,
      ...(clientSecret && { clientSecret }),
      ...(orderId && { orderId }),
    });
  } catch (err) {
    next(err);
  }
};

export const completePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId, status, transactionId } = completePaymentSchema.parse(req.body);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { student: { include: { user: true } } },
    });

    if (!payment) {
      return next(new AppError('Payment record not found.', 404));
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return next(new AppError('Payment has already been processed.', 400));
    }

    // Complete transaction via DB transaction
    const receiptUrl = `https://hostel-receipts.s3.amazonaws.com/receipt_${paymentId}_${Date.now()}.pdf`;
    
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: status as PaymentStatus,
          transactionId,
          receiptUrl: status === 'PAID' ? receiptUrl : null,
        },
      });

      await tx.transaction.create({
        data: {
          paymentId,
          amount: payment.amount,
          status,
          provider: payment.provider || 'MOCK',
          transactionId,
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          userId: payment.student.userId,
          title: `Mess/Hostel Payment ${status}`,
          message: `Your payment of ₹${payment.amount} for ${payment.type.toLowerCase()} was ${status.toLowerCase()}`,
          type: 'PAYMENT',
        },
      });
    });

    logger.info(`💳 Payment completed: ID ${paymentId} | Status ${status}`);

    res.status(200).json({
      status: 'success',
      message: `Payment status updated to ${status}.`,
      receiptUrl: status === 'PAID' ? receiptUrl : undefined,
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentPayments = async (req: Request, res: Response, next: NextFunction) => {
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

    const payments = await prisma.payment.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      payments,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllPayments = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await prisma.payment.findMany({
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
      payments,
    });
  } catch (err) {
    next(err);
  }
};
