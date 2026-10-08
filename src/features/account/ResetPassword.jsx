import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { homePathFor } from '../../lib/roles';
import { authErrorMessage, validateNewPassword } from '../../lib/passwords';
import AuthCard from './AuthCard';
import NewPasswordFields from './PasswordFields';

// Error que Supabase deja en la URL cuando el enlace del correo ha caducado
function linkErrorFromUrl() {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
  return params.get('error_description') ? 'El enlace ha caducado o ya se ha usado. Solicita uno nuevo.' : '';
}

// Destino de los enlaces de invitación y recuperación, y paso obligatorio tras
// entrar con una contraseña temporal
export default function ResetPassword() {
  const { user, loading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [linkError] = useState(linkErrorFromUrl);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthCard
        eyebrow="Enlace no válido"
        title="No podemos verificar el enlace"
        description={linkError || 'El enlace ha caducado, ya se ha usado o no es correcto. Pide uno nuevo para crear tu contraseña.'}
      >
        <div className="flex flex-col gap-3">
          <Link to="/recuperar-contrasena" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-4 text-sm font-semibold text-center">
            Solicitar un enlace nuevo
          </Link>
          <Link to="/login" className="text-center text-xs font-semibold text-text-active hover:underline">Volver a iniciar sesión</Link>
        </div>
      </AuthCard>
    );
  }

  const isFirstPassword = user.mustChangePassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = validateNewPassword(password, confirmation);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await api.account.setPassword(password);
      await refreshUser();
      navigate(homePathFor(user.role), { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      eyebrow={isFirstPassword ? 'Bienvenida' : 'Restablecer contraseña'}
      title={isFirstPassword ? 'Crea tu contraseña' : 'Elige una contraseña nueva'}
      description={isFirstPassword
        ? `Hola, ${user.name}. Antes de entrar, elige la contraseña con la que accederás a partir de ahora.`
        : `Cuenta: ${user.email}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start text-red-500 text-xs gap-3">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <NewPasswordFields
          password={password}
          setPassword={setPassword}
          confirmation={confirmation}
          setConfirmation={setConfirmation}
          autoFocus
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            : 'Guardar contraseña y entrar'}
        </button>
      </form>

      <button
        type="button"
        onClick={async () => {
          await logout();
          navigate('/login', { replace: true });
        }}
        className="mt-6 text-xs font-semibold text-text-muted hover:text-text-main cursor-pointer"
      >
        ¿No eres {user.name}? Cerrar sesión
      </button>
    </AuthCard>
  );
}
