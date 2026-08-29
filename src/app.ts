import cookieParser from 'cookie-parser';
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { authRoutes } from './modules/auth/auth.routes';
import { brokerRoutes } from './modules/brokers/broker.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { distributionRoutes } from './modules/distributions/distribution.routes';
import { formRoutes } from './modules/forms/form.routes';
import { leadRoutes, publicRoutes } from './modules/leads/lead.routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ data: { status: 'ok', uptime: process.uptime() }, error: null });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/brokers', brokerRoutes);
  app.use('/api/forms', formRoutes);
  app.use('/api/distributions', distributionRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
