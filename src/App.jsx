import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { LEARNER_ROLES, homePathFor } from './lib/roles';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';

// Cada panel se descarga solo cuando se usa (el de admin no llega a los alumnos)
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const ForgotPassword = lazy(() => import('./features/account/ForgotPassword'));
const ResetPassword = lazy(() => import('./features/account/ResetPassword'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// Redirección de la ruta raíz (/) según la sesión
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
              <Route path="/restablecer-contrasena" element={<ResetPassword />} />

              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={LEARNER_ROLES}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<HomeRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
