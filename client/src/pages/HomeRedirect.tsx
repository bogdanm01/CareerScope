import { Navigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { authHydratedAtom, authSessionAtom } from '../store/auth';

export const HomeRedirect = () => {
  const hydrated = useAtomValue(authHydratedAtom);
  const session = useAtomValue(authSessionAtom);

  if (!hydrated) {
    return <div className="app-loading">Loading...</div>;
  }

  const target = session?.user.role === 'Admin' ? '/panel/admin' : session ? '/panel' : '/login';

  return <Navigate to={target} replace />;
};
