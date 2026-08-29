import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

const app = createApp();

app.listen(env.PORT, env.HOST, () => {
  logger.info(`Backend listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
});
