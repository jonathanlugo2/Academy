import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div role="alert" className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-500 text-xs font-mono">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 cursor-pointer hover:opacity-70" title="Cerrar">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
