import { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE, verifyAuthToken } from '../modules/auth/auth.service';
import { ApiError } from './error-handler';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[AUTH_COOKIE];
  const userId = typeof token === 'string' ? verifyAuthToken(token) : null;

  if (userId === null) {
    next(new ApiError(401, 'Not authenticated'));
    return;
  }

  req.userId = userId;
  next();
}
