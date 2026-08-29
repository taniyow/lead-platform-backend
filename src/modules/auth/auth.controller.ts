import { Request, Response } from 'express';
import { ApiError } from '../../middleware/error-handler';
import { loginSchema } from './auth.schema';
import {
  AUTH_COOKIE,
  authCookieOptions,
  getUserById,
  signAuthToken,
  verifyCredentials,
} from './auth.service';

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const user = await verifyCredentials(input.email, input.password);
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }
  res.cookie(AUTH_COOKIE, signAuthToken(user.id), authCookieOptions);
  res.json({ data: { user }, error: null });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE, authCookieOptions);
  res.json({ data: { success: true }, error: null });
}

export async function me(req: Request, res: Response) {
  const user = req.userId !== undefined ? await getUserById(req.userId) : null;
  if (!user) {
    throw new ApiError(401, 'Not authenticated');
  }
  res.json({ data: { user }, error: null });
}
