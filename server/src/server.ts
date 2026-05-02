import 'reflect-metadata';
import { registerDependencies } from './config/dependencies.ts';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import env from './config/env.ts';
import logger from './config/logger.ts';

import { auth } from './config/auth.ts';
import { toNodeHandler } from 'better-auth/node';
import { apiRouter } from './routes/index.ts';

const configureMiddleware = (app: express.Application): void => {
  app.use(helmet());
  app.use(cookieParser());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    }),
  );
  app.all('/api/auth/*splat', toNodeHandler(auth));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api', apiRouter);
};

const createApp = (): express.Application => {
  const app = express();
  configureMiddleware(app);
  return app;
};

registerDependencies();

const app = createApp();

app.listen(env.SERVER_PORT, () => {
  logger.info(`Server started on http://localhost:${env.SERVER_PORT}`);
});
