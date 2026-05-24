import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { DashboardPage } from './pages/DashboardPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { HomeRedirect } from './pages/HomeRedirect';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RecruiterOnboardingPage } from './pages/RecruiterOnboardingPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { authHydratedAtom, authLoadingAtom, authSessionAtom, hydrateAuthAtom } from './store/auth';

const AppBootstrap = () => {
  const hydrateAuth = useSetAtom(hydrateAuthAtom);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  return null;
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const hydrated = useAtomValue(authHydratedAtom);
  const session = useAtomValue(authSessionAtom);

  if (!hydrated) {
    return <div className="app-loading">Restoring your session...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const hydrated = useAtomValue(authHydratedAtom);
  const session = useAtomValue(authSessionAtom);

  if (!hydrated) {
    return <div className="app-loading">Loading auth state...</div>;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const loading = useAtomValue(authLoadingAtom);

  return (
    <BrowserRouter>
      <AppBootstrap />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage loading={loading} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage loading={loading} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register/recruiter"
          element={
            <PublicOnlyRoute>
              <RecruiterOnboardingPage loading={loading} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage loading={loading} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage loading={loading} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage loading={loading} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
