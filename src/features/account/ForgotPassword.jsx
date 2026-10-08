import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MailCheck, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { authErrorMessage } from '../../lib/passwords';
import AuthCard from './AuthCard';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.account.sendRecoveryEmail(email);
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err, 'No se pudo enviar el correo. Inténtalo de nuevo en unos minutos.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Recuperar acceso"
      title="¿Has olvidado tu contraseña?"
      description={sent ? null : 'Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.'}
    >
      {sent ? (
        // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-sm text-text-main">
          <MailCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <p>
            Si <strong>{email.trim()}</strong> corresponde a una cuenta activa, en unos minutos recibirás un correo con el enlace.
            Revisa también la carpeta de spam. El enlace caduca en 1 hora.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start text-red-500 text-xs gap-3">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-2">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@expatfiscal.es"
                autoComplete="email"
                autoFocus
                required
                className="w-full bg-bg-input border border-border-main focus:border-border-hover focus:shadow-[0_0_0_3px_rgba(15,117,188,0.2)] rounded-xl pl-11 pr-4 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none transition-all duration-200"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              : 'Enviar enlace'}
          </button>
        </form>
      )}

      <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-text-active hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a iniciar sesión
      </Link>
    </AuthCard>
  );
}
