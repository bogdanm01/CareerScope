import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../config/auth.ts';
import { UserRole } from '../data/utils/constants.ts';

export const authGuard = (allowedRoles?: UserRole[]) => async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  req.session = session.session;
  req.user = session.user;

  if (allowedRoles?.length && !allowedRoles.includes(session.user.role as UserRole)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
};
