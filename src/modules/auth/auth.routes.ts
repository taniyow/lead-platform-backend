import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { login, logout, me } from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
authRoutes.get('/me', requireAuth, me);
