import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import env from './config/env.ts';
import logger from './config/logger.ts';

const configureMiddleware = (app: express.Application): void => {
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
};

const createApp = (): express.Application => {
  const app = express();
  configureMiddleware(app);

  return app;
};

const app = createApp();

app.get('/', (_req, res, next) => {
  res.send('Hello world');
  next();
});

app.listen(env.SERVER_PORT, () => {
  logger.info(`Server started on http://localhost:${env.SERVER_PORT}`);
});
