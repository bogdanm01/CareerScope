import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Toast } from '@heroui/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { PanelShell } from './components/PanelShell';
import { AppThemeProvider } from './components/ThemeContext';
import { CandidateJobsPage } from './pages/CandidateJobsPage';
import { CandidateApplicationDetailPage } from './pages/CandidateApplicationDetailPage';
import { CandidateApplicationsPage } from './pages/CandidateApplicationsPage';
import { CandidateJobDetailPage } from './pages/CandidateJobDetailPage';
import { CandidateProfilePage } from './pages/CandidateProfilePage';
import { AdminCompanyApprovalsPage } from './pages/AdminCompanyApprovalsPage';
import { AdminCompaniesPage } from './pages/AdminCompaniesPage';
import { AdminCompanyDetailPage } from './pages/AdminCompanyDetailPage';
import { AdminCompanyProfilePage } from './pages/AdminCompanyProfilePage';
import { AdminJobPostingsPage } from './pages/AdminJobPostingsPage';
import { AdminJobPostingDetailPage } from './pages/AdminJobPostingDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CompanyProfilePage } from './pages/CompanyProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { HomeRedirect } from './pages/HomeRedirect';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RecruiterApplicationDetailPage } from './pages/RecruiterApplicationDetailPage';
import { RecruiterOnboardingPage } from './pages/RecruiterOnboardingPage';
import { RecruiterApplicationsPage } from './pages/RecruiterApplicationsPage';
import { RecruiterJobPostingCreatePage } from './pages/RecruiterJobPostingCreatePage';
import { RecruiterJobPostingDetailPage } from './pages/RecruiterJobPostingDetailPage';
import { RecruiterJobPostingsPage } from './pages/RecruiterJobPostingsPage';
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

const getPanelHomePath = (role?: string) => (role === 'Admin' ? '/panel/admin' : '/panel');

const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const hydrated = useAtomValue(authHydratedAtom);
  const session = useAtomValue(authSessionAtom);

  if (!hydrated) {
    return <div className="app-loading">Loading auth state...</div>;
  }

  if (session) {
    return <Navigate to={getPanelHomePath(session.user.role)} replace />;
  }

  return children;
};

const RoleRoute = ({ children, allow }: { children: ReactNode; allow: Array<'Candidate' | 'Recruiter' | 'Admin'> }) => {
  const session = useAtomValue(authSessionAtom);

  if (!session || !allow.includes(session.user.role as 'Candidate' | 'Recruiter' | 'Admin')) {
    return <Navigate to="/panel" replace />;
  }

  return children;
};

function App() {
  const loading = useAtomValue(authLoadingAtom);

  return (
    <AppThemeProvider>
      <Toast.Provider placement="top" />
      <BrowserRouter>
        <AppBootstrap />
        <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/companies/:id" element={<CompanyProfilePage />} />
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
          path="/panel"
          element={
            <ProtectedRoute>
              <PanelShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route
            path="analytics"
            element={
              <RoleRoute allow={['Candidate', 'Recruiter', 'Admin']}>
                <AnalyticsPage />
              </RoleRoute>
            }
          />
          <Route
            path="profile"
            element={
              <RoleRoute allow={['Candidate']}>
                <CandidateProfilePage />
              </RoleRoute>
            }
          />
          <Route
            path="jobs"
            element={
              <RoleRoute allow={['Candidate']}>
                <CandidateJobsPage />
              </RoleRoute>
            }
          />
          <Route
            path="jobs/:id"
            element={
              <RoleRoute allow={['Candidate']}>
                <CandidateJobDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="job-postings"
            element={
              <RoleRoute allow={['Recruiter']}>
                <RecruiterJobPostingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="job-postings/new"
            element={
              <RoleRoute allow={['Recruiter']}>
                <RecruiterJobPostingCreatePage loading={loading} />
              </RoleRoute>
            }
          />
          <Route
            path="job-postings/:id"
            element={
              <RoleRoute allow={['Recruiter']}>
                <RecruiterJobPostingDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="job-applications"
            element={
              <RoleRoute allow={['Recruiter', 'Admin']}>
                <RecruiterApplicationsPage />
              </RoleRoute>
            }
          />
          <Route
            path="job-applications/:id"
            element={
              <RoleRoute allow={['Recruiter', 'Admin']}>
                <RecruiterApplicationDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="applications"
            element={
              <RoleRoute allow={['Candidate']}>
                <CandidateApplicationsPage />
              </RoleRoute>
            }
          />
          <Route
            path="applications/:id"
            element={
              <RoleRoute allow={['Candidate']}>
                <CandidateApplicationDetailPage />
              </RoleRoute>
            }
          />
          <Route path="admin">
            <Route
              index
              element={
                <RoleRoute allow={['Admin']}>
                  <DashboardPage />
                </RoleRoute>
              }
            />
            <Route
              path="companies"
              element={
                <RoleRoute allow={['Admin']}>
                  <AdminCompaniesPage />
                </RoleRoute>
              }
            />
            <Route
              path="companies/:id"
              element={
                <RoleRoute allow={['Admin']}>
                  <AdminCompanyProfilePage />
                </RoleRoute>
              }
            />
            <Route
              path="company-approvals"
              element={
                <RoleRoute allow={['Admin']}>
                  <AdminCompanyApprovalsPage />
                </RoleRoute>
              }
            />
            <Route
              path="company-approvals/:id"
              element={
                <RoleRoute allow={['Admin']}>
                  <AdminCompanyDetailPage />
                </RoleRoute>
              }
            />
            <Route
              path="job-postings"
              element={
                <RoleRoute allow={['Admin']}>
                  <AdminJobPostingsPage />
                </RoleRoute>
              }
            />
            <Route
              path="job-postings/:id"
              element={
                <RoleRoute allow={['Admin']}>
                  <AdminJobPostingDetailPage />
                </RoleRoute>
              }
            />
          </Route>
        </Route>
        <Route path="/dashboard" element={<Navigate to="/panel" replace />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppThemeProvider>
  );
}

export default App;
