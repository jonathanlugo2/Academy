import { X } from 'lucide-react';

// Piezas visuales compartidas por el editor de formaciones (mismo estilo que el resto del panel)

export const inputClass = 'w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main placeholder-text-muted focus:border-border-hover outline-none transition-all font-mono shadow-inner';
export const smallInputClass = 'w-full bg-bg-input border border-border-main rounded-xl px-3 py-2 text-xs text-text-main placeholder-text-muted focus:border-border-hover outline-none transition-all font-mono';
export const primaryButton = 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white px-5 py-2.5 rounded-xl text-[10px] font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-indigo-400/20 cursor-pointer';
export const secondaryButton = 'bg-bg-input border border-border-main text-text-muted hover:text-text-title hover:border-border-hover disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 rounded-xl text-[10px] font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer';
export const iconButton = 'p-2 text-text-muted hover:text-text-title hover:bg-bg-input rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none';
export const dangerIconButton = 'p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none';

export function Field({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">{label}</label>
      {hint && <span className="text-[9px] text-text-muted font-mono uppercase tracking-tight block -mt-1 mb-2 ml-1">{hint}</span>}
      {children}
    </div>
  );
}

export function Panel({ title, icon: Icon, actions, children }) {
  return (
    <section className="bg-bg-card border border-border-main rounded-2xl p-5 space-y-4">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-xs font-bold text-text-title uppercase tracking-widest flex items-center gap-2 font-mono">
            {Icon && <Icon className="w-4 h-4 text-text-active" />}
            {title}
          </h4>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-bg-card border border-border-main rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-5 border-b border-border-main flex justify-between items-center bg-bg-input/50">
          <h3 className="text-sm font-bold text-text-title uppercase tracking-tight font-mono">{title}</h3>
          <button onClick={onClose} className={iconButton} title="Cerrar"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border-main bg-bg-card/50 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>;
}
