import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../config/auth.ts';
import { UserRole } from '../data/util/constants.ts';
import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/app-error.ts';

export const authGuard = (allowedRoles?: UserRole[]) => async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return next(new UnauthorizedError());
  }

  req.session = session.session;
  req.user = session.user;

  if (allowedRoles?.length && !allowedRoles.includes(session.user.role as UserRole)) {
    return next(new ForbiddenError());
  }

  return next();
};
