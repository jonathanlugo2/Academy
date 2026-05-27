import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

// Componente para manejar la redirección de la ruta raíz (/)
function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'admin' 
    ? <Navigate to="/admin" replace /> 
    : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta de Login */}
          <Route path="/login" element={<Login />} />

          {/* Panel de Administración Protegido (solo para rol 'admin') */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Panel del Nómada Protegido (solo para rol 'student') */}
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Redirección automática de la raíz (/) */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Redirección por defecto para cualquier ruta no encontrada */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
