import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { triageDispute } from '../triage-engine.js';
import { validateDisputeInput } from '../validation.js';
import db from '../db.js';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';
import { generateDisputeRef } from '../dispute-ref.js';
import type { AppError } from '../middleware/errorHandler.js';

/** Max attempts to generate a unique disputeRef before giving up */
const MAX_REF_ATTEMPTS = 5;

export const disputesRouter = Router();

// POST / — create a new dispute and run triage
disputesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validateDisputeInput(req.body);
    if (errors.length > 0) {
      const err = new Error('Request validation failed') as Error & {
        status: number;
        code: string;
        details: unknown;
      };
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      err.details = errors;
      throw err;
    }

    const {
      customerName,
      transactionRef,
      paymentType,
      issueCategory,
      transactionStatus,
      amount,
      transactionDate,
      description,
    } = req.body as {
      customerName: string;
      transactionRef: string;
      paymentType: string;
      issueCategory: string;
      transactionStatus: string;
      amount: number;
      transactionDate: string;
      description?: string;
    };

    const disputeAge = Math.floor(
      (Date.now() - new Date(transactionDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    const recommendedAction = triageDispute({
      paymentType: paymentType as Parameters<typeof triageDispute>[0]['paymentType'],
      issueCategory: issueCategory as Parameters<typeof triageDispute>[0]['issueCategory'],
      transactionStatus: transactionStatus as Parameters<typeof triageDispute>[0]['transactionStatus'],
      amount: typeof amount === 'number' ? amount : Number(amount),
      disputeAge,
    });

    const resolvedAmount = typeof amount === 'number' ? amount : Number(amount);

    // Check for duplicate transactionRef before attempting create
    const existing = await db.dispute.findFirst({ where: { transactionRef } });
    if (existing) {
      const err = new Error(
        `A dispute for transaction reference '${transactionRef}' already exists (dispute id: ${existing.id})`,
      ) as AppError;
      err.status = 409;
      err.code = 'DUPLICATE_TRANSACTION_REF';
      throw err;
    }

    // Retry loop: handles the rare case where generateDisputeRef() produces a collision (P2002 on disputeRef)
    let dispute;
    for (let attempt = 0; attempt < MAX_REF_ATTEMPTS; attempt++) {
      try {
        dispute = await db.dispute.create({
          data: {
            disputeRef: generateDisputeRef(),
            customerName,
            transactionRef,
            paymentType,
            issueCategory,
            transactionStatus,
            amount: resolvedAmount,
            transactionDate: new Date(transactionDate),
            description: description ?? null,
            recommendedAction,
            disputeStatus: 'open',
          },
          include: { statusHistory: true },
        });
        break; // success — exit retry loop
      } catch (createErr) {
        const isRefCollision =
          createErr instanceof Prisma.PrismaClientKnownRequestError &&
          createErr.code === 'P2002' &&
          Array.isArray(createErr.meta?.target) &&
          (createErr.meta.target as string[]).includes('disputeRef');
        if (!isRefCollision) throw createErr;
        // disputeRef collision — regenerate and retry
      }
    }

    if (!dispute) {
      const err = new Error('Failed to generate a unique dispute reference') as AppError;
      err.status = 500;
      err.code = 'INTERNAL_ERROR';
      throw err;
    }

    res.status(201).json(dispute);
  } catch (err) {
    next(err);
  }
});

// GET / — list disputes with pagination
disputesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawPage = parseInt(String(req.query.page ?? String(DEFAULT_PAGE)), 10);
    const rawPageSize = parseInt(String(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)), 10);

    const page = isNaN(rawPage) || rawPage < 1 ? DEFAULT_PAGE : rawPage;
    const pageSize = isNaN(rawPageSize) || rawPageSize < 1 ? DEFAULT_PAGE_SIZE : Math.min(rawPageSize, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      db.dispute.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          disputeRef: true,
          customerName: true,
          paymentType: true,
          issueCategory: true,
          recommendedAction: true,
          disputeStatus: true,
          amount: true,
          createdAt: true,
        },
      }),
      db.dispute.count(),
    ]);

    res.json({
      data,
      pagination: { page, pageSize, total },
    });
  } catch (err) {
    next(err);
  }
});

// GET /:id — fetch a single dispute with status history
disputesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: { statusHistory: true },
    });

    if (!dispute) {
      const err = new Error(`No dispute found with id ${id}`) as Error & {
        status: number;
        code: string;
      };
      err.status = 404;
      err.code = 'DISPUTE_NOT_FOUND';
      throw err;
    }

    res.json(dispute);
  } catch (err) {
    next(err);
  }
});

// Helper: throw a typed AppError for a dispute not found by id
function disputeNotFound(id: string): never {
  const err = new Error(`No dispute found with id ${id}`) as AppError;
  err.status = 404;
  err.code = 'DISPUTE_NOT_FOUND';
  throw err;
}

// Helper: map a Prisma P2025 (record not found) into our 404 AppError.
// Used to avoid a redundant findUnique before update/delete operations.
function handlePrismaError(err: unknown, id: string): never {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2025'
  ) {
    disputeNotFound(id);
  }
  throw err;
}

// PATCH /:id/resolve — mark a dispute as resolved
// Used by E2E tests to seed a resolved dispute; also a valid ops action.
disputesRouter.patch('/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      const err = new Error('reason is required and must be a non-empty string') as AppError;
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    // Single DB round-trip: update directly and let Prisma's P2025 handle missing records
    let updated;
    try {
      updated = await db.dispute.update({
        where: { id },
        data: {
          disputeStatus: 'resolved',
          statusHistory: {
            create: {
              status: 'resolved',
              reason: reason.trim(),
            },
          },
        },
        include: { statusHistory: true },
      });
    } catch (err) {
      handlePrismaError(err, id);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /:id/status — reopen or escalate a resolved dispute
disputesRouter.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body as { action?: string; reason?: string };

    // Validate action
    if (action !== 'reopen' && action !== 'escalate') {
      const err = new Error('action must be "reopen" or "escalate"') as AppError;
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    // Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      const err = new Error('reason is required and must be a non-empty string') as AppError;
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    // Fetch the dispute — needed to read current status and recommendedAction before updating
    const existing = await db.dispute.findUnique({ where: { id } });

    if (!existing) {
      disputeNotFound(id);
    }

    // Must be resolved to reopen or escalate; or reopened to escalate
    const canTransition =
      existing.disputeStatus === 'resolved' ||
      (existing.disputeStatus === 'reopened' && action === 'escalate');

    if (!canTransition) {
      const err = new Error(
        `Cannot perform '${action}' on a dispute with status '${existing.disputeStatus}'. ` +
        `Resolve can reopen or escalate; reopened disputes can only be escalated.`,
      ) as AppError;
      err.status = 422;
      err.code = 'INVALID_STATUS_TRANSITION';
      throw err;
    }

    const newDisputeStatus = action === 'escalate' ? 'escalated' : 'reopened';
    const newRecommendedAction =
      action === 'escalate' ? 'escalate_to_fraud' : existing.recommendedAction;

    const updated = await db.dispute.update({
      where: { id },
      data: {
        disputeStatus: newDisputeStatus,
        recommendedAction: newRecommendedAction,
        statusHistory: {
          create: {
            status: newDisputeStatus,
            reason: reason.trim(),
          },
        },
      },
      include: { statusHistory: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});
