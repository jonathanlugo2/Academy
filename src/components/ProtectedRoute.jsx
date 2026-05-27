import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400 font-medium">Cargando plataforma...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirigir al login si no hay sesión activa
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Si no tiene el rol necesario, redirigir a su correspondiente dashboard principal
    return user.role === 'admin' 
      ? <Navigate to="/admin" replace /> 
      : <Navigate to="/dashboard" replace />;
  }

  return children;
}
