import { useState } from 'react';
import { Check, Eye, EyeOff, Lock } from 'lucide-react';
import { passwordChecks } from '../../lib/passwords';

const INPUT_CLASS = 'w-full bg-bg-input border border-border-main focus:border-border-hover focus:shadow-[0_0_0_3px_rgba(15,117,188,0.2)] rounded-xl pl-11 pr-11 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none transition-all duration-200';

export function PasswordInput({ label, value, onChange, autoComplete, autoFocus }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-text-main mb-2">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required
          className={INPUT_CLASS}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-main cursor-pointer"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// Nueva contraseña + repetición, con los requisitos a la vista
export default function NewPasswordFields({ password, setPassword, confirmation, setConfirmation, autoFocus }) {
  return (
    <div className="space-y-4">
      <PasswordInput label="Nueva contraseña" value={password} onChange={setPassword} autoComplete="new-password" autoFocus={autoFocus} />
      <PasswordInput label="Repite la nueva contraseña" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {passwordChecks(password, confirmation).map(check => (
          <li key={check.id} className={`flex items-center gap-1.5 text-xs ${check.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'}`}>
            <Check className={`w-3.5 h-3.5 shrink-0 ${check.ok ? '' : 'opacity-30'}`} />
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
