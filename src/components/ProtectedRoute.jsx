import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { homePathFor } from '../lib/roles';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-text-muted font-medium">Cargando plataforma...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir a la página de su rol (o al login si el rol no es válido)
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  return children;
}
