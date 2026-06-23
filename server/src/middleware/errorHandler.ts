import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  // Only log server errors — 4xx are expected operational outcomes, not failures
  if (status >= 500) {
    console.error(`[${code}] ${message}`, err);
  }

  const errorBody: Record<string, unknown> = {
    code,
    message,
    status,
    timestamp: new Date().toISOString(),
  };

  if (err.details !== undefined) {
    errorBody.details = err.details;
  }

  res.status(status).json({
    error: errorBody,
  });
};
