import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../config/auth.ts';
import { UserRole } from '../data/util/constants.ts';
import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/app-error.ts';
import { getDbClient } from '../config/db-client.ts';
import { user } from '../data/schema/auth.schema.ts';
import { eq } from 'drizzle-orm';

export const authGuard = (allowedRoles?: UserRole[]) => async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return next(new UnauthorizedError());
  }

  const [account] = await getDbClient().select({ isDeleted: user.isDeleted }).from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!account || account.isDeleted) return next(new UnauthorizedError('Account is disabled.'));

  req.session = session.session;
  req.user = session.user;

  if (allowedRoles?.length && !allowedRoles.includes(session.user.role as UserRole)) {
    return next(new ForbiddenError());
  }

  return next();
};
