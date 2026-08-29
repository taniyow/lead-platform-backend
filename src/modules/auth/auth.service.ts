import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';

export const AUTH_COOKIE = 'token';

export const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.COOKIE_SECURE,
  path: '/',
};

export interface AuthUser {
  id: number;
  email: string;
}

export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) {
    return null;
  }
  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  return passwordMatches ? { id: user.id, email: user.email } : null;
}

export async function getUserById(id: number): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? { id: user.id, email: user.email } : null;
}

export function signAuthToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAuthToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === 'object' && payload.sub) {
      const userId = Number(payload.sub);
      return Number.isInteger(userId) ? userId : null;
    }
    return null;
  } catch {
    return null;
  }
}
