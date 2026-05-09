import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../config/auth.ts';
import { NextFunction, Request, Response } from 'express';

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (session) {
    req.session = session.session;
    req.user = session.user;
  }

  return next();
};
