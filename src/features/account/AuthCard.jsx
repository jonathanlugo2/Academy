import { GraduationCap } from 'lucide-react';

// Tarjeta centrada para las pantallas de acceso fuera del login
export default function AuthCard({ eyebrow, title, description, children }) {
  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 md:p-8 relative overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-[120px]"></div>
        <div className="absolute -bottom-20 right-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-[130px]"></div>
      </div>

      <section className="w-full max-w-md cyber-panel rounded-3xl p-8 md:p-10 border border-border-main relative z-10">
        <div className="inline-flex items-center gap-3 text-text-main mb-8">
          <div className="w-10 h-10 rounded-2xl bg-bg-active border border-border-active flex items-center justify-center text-text-active">
            <GraduationCap className="w-5 h-5 text-text-active" />
          </div>
          <p className="text-sm font-semibold text-text-title">ExpatFiscal Academy</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-bold text-text-title">{title}</h1>
          {description && <p className="mt-2 text-sm text-text-muted leading-relaxed">{description}</p>}
        </div>

        {children}
      </section>
    </div>
  );
}
