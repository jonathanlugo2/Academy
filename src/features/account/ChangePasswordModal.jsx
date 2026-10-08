import { useState } from 'react';
import { CheckCircle2, KeyRound, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { authErrorMessage, validateNewPassword } from '../../lib/passwords';
import NewPasswordFields, { PasswordInput } from './PasswordFields';

// El propio usuario cambia su contraseña confirmando la actual
export default function ChangePasswordModal({ onClose }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = validateNewPassword(password, confirmation, current);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await api.account.changePassword(user.email, current, password);
      setDone(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
      <div className="bg-bg-card border border-border-main rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-5 border-b border-border-main flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-bg-active border border-border-active flex items-center justify-center text-text-active">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 id="change-password-title" className="text-base font-bold text-text-title">Cambiar contraseña</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-xl text-text-muted hover:text-text-title cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-sm text-text-main">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p>Contraseña actualizada. Úsala la próxima vez que inicies sesión.</p>
            </div>
            <button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-semibold cursor-pointer">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start text-red-500 text-xs gap-3">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <PasswordInput label="Contraseña actual" value={current} onChange={setCurrent} autoComplete="current-password" autoFocus />
            <NewPasswordFields
              password={password}
              setPassword={setPassword}
              confirmation={confirmation}
              setConfirmation={setConfirmation}
            />
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 bg-bg-input border border-border-main text-text-muted hover:text-text-title rounded-xl py-3 text-sm font-semibold cursor-pointer">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  : 'Guardar contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
