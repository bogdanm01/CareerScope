import { z } from 'zod';
import { ApiErrorDetail } from './api-response.ts';

export class ZodValidationError extends Error {
  public errors: ApiErrorDetail[];

  constructor(error: z.ZodError) {
    super('Request validation failed');

    this.errors = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
}
