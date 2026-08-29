import { Request, Response, Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getDashboardStats } from './dashboard.service';

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);
dashboardRoutes.get('/', async (_req: Request, res: Response) => {
  const stats = await getDashboardStats();
  res.json({ data: { stats }, error: null });
});
