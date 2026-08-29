import cookieParser from 'cookie-parser';
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { authRoutes } from './modules/auth/auth.routes';
import { brokerRoutes } from './modules/brokers/broker.routes';
import { formRoutes } from './modules/forms/form.routes';

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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
