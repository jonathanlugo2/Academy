import { useState } from 'react';
import { Check, Copy, KeyRound, ShieldAlert } from 'lucide-react';

// Muestra una sola vez la contraseña temporal generada en el servidor
export default function TempPasswordModal({ credential, onClose }) {
  const [copied, setCopied] = useState(false);

  const message = [
    `Hola, ${credential.name}:`,
    '',
    'Ya tienes acceso a ExpatFiscal Academy.',
    `Web: ${window.location.origin}/login`,
    `Usuario: ${credential.email}`,
    `Contraseña temporal: ${credential.password}`,
    '',
    'Al entrar por primera vez te pediremos que elijas tu propia contraseña.'
  ].join('\n');

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="temp-password-title">
      <div className="bg-bg-card border border-border-main rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-5 border-b border-border-main flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-bg-active border border-border-active flex items-center justify-center text-text-active">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 id="temp-password-title" className="text-base font-bold text-text-title">Contraseña temporal</h3>
            <p className="text-xs text-text-muted">{credential.name} · {credential.email}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-bg-input border border-border-main rounded-xl text-base font-mono font-bold text-text-title tracking-wide select-all">
              {credential.password}
            </code>
            <button
              onClick={() => copy(credential.password)}
              className="p-3 bg-bg-input border border-border-main rounded-xl text-text-muted hover:text-text-title cursor-pointer"
              aria-label="Copiar contraseña"
              title="Copiar contraseña"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-text-main leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              No se volverá a mostrar. Envíala por un canal distinto al del usuario (p. ej. en persona o por teléfono).
              Al entrar, el sistema le obligará a elegir su propia contraseña.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => copy(message)}
              className="flex-1 bg-bg-input border border-border-main text-text-main hover:text-text-title rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Copy className="w-4 h-4" /> Copiar mensaje
            </button>
            <button onClick={onClose} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-semibold cursor-pointer">
              Hecho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
