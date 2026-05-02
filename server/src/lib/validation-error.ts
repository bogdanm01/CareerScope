import { z } from 'zod';

type ValidationErrorDetail = {
  field: string;
  message: string;
};

export class ValidationError extends Error {
  public errors: ValidationErrorDetail[];

  constructor(error: z.ZodError) {
    super('Request validation failed');

    this.errors = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
}
