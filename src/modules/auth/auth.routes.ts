import { Router } from 'express';
import { login, logout } from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
