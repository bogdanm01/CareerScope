import logger from '../config/logger.ts';
import env from '../config/env.ts';
import { ErrorRequestHandler } from 'express';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { ApiErrorResponse } from '../lib/api-response.ts';
import { AppError } from '../lib/app-error.ts';

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const statusCode = err instanceof ZodValidationError ? 400 : err instanceof AppError ? err.statusCode : 500;
  const logPayload = {
    err,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    userId: req.user?.id,
  };

  if (err instanceof ZodValidationError) {
    logger.warn(logPayload, 'Request validation failed');
    const response: ApiErrorResponse = {
      success: false,
      message: 'Bad request. Request validation failed.',
      errors: err.errors,
    };

    return res.status(400).send(response);
  }

  if (err instanceof AppError) {
    logger.warn(logPayload, err.message);
    const response: ApiErrorResponse = {
      success: false,
      message: err.message,
      code: err.code,
    };

    return res.status(err.statusCode).send(response);
  }

  logger.error(logPayload, 'Unhandled request error');
  const response: ApiErrorResponse = {
    success: false,
    message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  };

  return res.status(500).send(response);
};
