import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabaseClient';
import { homePathFor } from '../lib/roles';
import { Mail, Lock, ArrowRight, ShieldAlert, GraduationCap, Building2, CheckCircle2 } from 'lucide-react';

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
                <p className="text-xs text-text-muted">Formación y acompañamiento en España</p>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-text-title leading-tight">
              Tu campus profesional para instalarte en España con claridad.
            </h1>
            <p className="mt-4 text-text-main text-sm leading-relaxed max-w-md">
              Accede a recursos guiados sobre residencia, fiscalidad y herramientas prácticas para expatriados.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-border-main bg-bg-input/40 p-4">
              <GraduationCap className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-title">Contenido educativo</p>
                <p className="text-xs text-text-muted">Documentos, vídeos y guías prácticas adaptadas al perfil expatriado.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border-main bg-bg-input/40 p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-title">Método paso a paso</p>
                <p className="text-xs text-text-muted">Planifica tus trámites con una ruta formativa ordenada.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cyber-panel rounded-3xl p-8 md:p-10 border border-border-main">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Acceso seguro</p>
            <h2 className="mt-2 text-2xl font-bold text-text-title">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-text-muted">Introduce tus credenciales para continuar en la plataforma.</p>
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
              <label className="block text-xs font-semibold text-text-main mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
            Si no puedes acceder, contacta con administración para validar tus permisos de cuenta.
          </p>
        </section>
      </div>
    </div>
  );
}
