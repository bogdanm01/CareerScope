import { Navigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { authHydratedAtom, authSessionAtom } from '../store/auth';
import { getPanelHomePath } from '../lib/navigation';

export const HomeRedirect = () => {
  const hydrated = useAtomValue(authHydratedAtom);
  const session = useAtomValue(authSessionAtom);

  if (!hydrated) {
    return <div className="app-loading">Loading...</div>;
  }

  const target = session ? getPanelHomePath(session.user.role) : '/jobs';

  return <Navigate to={target} replace />;
};
