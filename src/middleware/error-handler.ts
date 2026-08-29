import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ data: null, error: { message: 'Not found' } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ data: null, error: { message: err.message } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      data: null,
      error: {
        message: 'Validation failed',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  logger.error('Unhandled error', err);
  res.status(500).json({ data: null, error: { message: 'Internal server error' } });
}
