import cookieParser from 'cookie-parser';
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ data: { status: 'ok', uptime: process.uptime() }, error: null });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
