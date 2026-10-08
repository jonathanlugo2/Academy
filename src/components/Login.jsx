import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabaseClient';
import { homePathFor } from '../lib/roles';
import { Mail, Lock, ArrowRight, ShieldAlert, GraduationCap, Globe, BriefcaseBusiness } from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  // Página pedida antes del login, solo si pertenece al panel de su rol
  const targetFor = (role) => {
    const home = homePathFor(role);
    return typeof from === 'string' && from.startsWith(home) ? from : home;
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      navigate(targetFor(user.role), { replace: true });
    }
  }, [user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Limpiar cualquier sesión corrupta anterior en localStorage
      // antes de intentar un nuevo login (no toca el servidor)
      await supabase.auth.signOut({ scope: 'local' });
      
      const loggedUser = await login(email, password);
      navigate(targetFor(loggedUser.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 md:p-8 relative overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-[120px]"></div>
        <div className="absolute -bottom-20 right-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-[130px]"></div>
      </div>

      <div className="w-full max-w-md lg:max-w-5xl grid lg:grid-cols-2 gap-6 relative z-10">
        <section className="hidden lg:flex cyber-panel rounded-3xl p-8 md:p-10 border border-border-main flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-3 text-text-main mb-8">
              <div className="w-11 h-11 rounded-2xl bg-bg-active border border-border-active flex items-center justify-center text-text-active">
                <GraduationCap className="w-5 h-5 text-text-active" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-title">ExpatFiscal Academy</p>
                <p className="text-xs text-text-muted">El campus de formación de Asidne</p>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-text-title leading-tight">
              Un solo campus para quienes llegan a España y para quienes les asesoran.
            </h1>
            <p className="mt-4 text-text-main text-sm leading-relaxed max-w-md">
              La plataforma de formación de Asidne para los nómadas digitales que acompañamos y para el equipo de asesores de la firma.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-border-main bg-bg-input/40 p-4">
              <Globe className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-title">Nómadas digitales</p>
                <p className="text-xs text-text-muted">Guías de residencia, fiscalidad y trámites, tu dossier fiscal con el control de los 183 días y soporte directo con Asidne.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border-main bg-bg-input/40 p-4">
              <BriefcaseBusiness className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-title">Asesores de Asidne</p>
                <p className="text-xs text-text-muted">Formación interna de la firma: procedimientos, criterios y actualizaciones normativas.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cyber-panel rounded-3xl p-8 md:p-10 border border-border-main">
          <div className="mb-8">
            {/* En móvil no se ve el panel izquierdo: la marca y el público van aquí */}
            <div className="lg:hidden inline-flex items-center gap-2 mb-6 text-text-title">
              <GraduationCap className="w-5 h-5 text-text-active" />
              <span className="text-sm font-semibold">ExpatFiscal Academy · Asidne</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Nómadas y asesores de Asidne</p>
            <h2 className="mt-2 text-2xl font-bold text-text-title">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-text-muted">Entra con el correo con el que Asidne te dio de alta.</p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start text-red-500 text-xs gap-3">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@expatfiscal.es"
                  required
                  className="w-full bg-bg-input border border-border-main focus:border-border-hover focus:shadow-[0_0_0_3px_rgba(15,117,188,0.2)] rounded-xl pl-11 pr-4 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-text-main">
                  Contraseña
                </label>
                <Link to="/recuperar-contrasena" className="text-xs font-semibold text-text-active hover:underline">
                  ¿Has olvidado tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-bg-input border border-border-main focus:border-border-hover focus:shadow-[0_0_0_3px_rgba(15,117,188,0.2)] rounded-xl pl-11 pr-4 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Entrar a la plataforma
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-xs text-text-muted leading-relaxed">
            ¿Primera vez? Usa el enlace de tu correo de invitación o la contraseña temporal que te ha facilitado administración.
          </p>
        </section>
      </div>
    </div>
  );
}
