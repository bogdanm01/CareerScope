import { ERROR_CODE, ErrorCode } from './error-codes.ts';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: ErrorCode,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODE.BAD_REQUEST) {
    super(400, message, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code: ErrorCode = ERROR_CODE.UNAUTHORIZED) {
    super(401, message, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code: ErrorCode = ERROR_CODE.FORBIDDEN) {
    super(403, message, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODE.CONFLICT) {
    super(409, message, code);
  }
}
