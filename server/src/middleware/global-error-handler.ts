import logger from '../config/logger.ts';
import env from '../config/env.ts';
import { ErrorRequestHandler } from 'express';
import { ValidationError } from 'ajv';

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const logPayload = {
    err,
    method: req.method,
    url: req.originalUrl,
    statusCode: err instanceof ValidationError ? 400 : 500,
    userId: req.user?.id,
  };

  if (err instanceof ValidationError) {
    logger.warn(logPayload, 'Request validation failed');
    return res.status(400).send({
      success: false,
      message: 'Bad request. Request validation failed.',
      errors: err.errors,
    });
  }

  logger.error(logPayload, 'Unhandled request error');
  return res.status(500).send({
    success: false,
    message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
};
