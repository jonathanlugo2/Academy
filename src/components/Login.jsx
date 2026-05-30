import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, ArrowRight, ShieldAlert, Scale, GraduationCap, Building2, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-[120px]"></div>
        <div className="absolute -bottom-20 right-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-[130px]"></div>
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 relative z-10">
        <section className="cyber-panel rounded-3xl p-8 md:p-10 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-3 text-zinc-300 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center">
                <Scale className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">ExpatFiscal Academy</p>
                <p className="text-xs text-zinc-500">Formación y acompañamiento en España</p>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 leading-tight">
              Tu campus profesional para instalarte en España con claridad.
            </h1>
            <p className="mt-4 text-zinc-400 text-sm leading-relaxed max-w-md">
              Accede a recursos guiados sobre residencia, fiscalidad y herramientas prácticas para expatriados, con una experiencia estructurada y elegante.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <GraduationCap className="w-5 h-5 text-indigo-300 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-zinc-200">Contenido educativo</p>
                <p className="text-xs text-zinc-500">Documentos, vídeos y guías prácticas adaptadas al perfil expatriado.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-zinc-200">Método paso a paso</p>
                <p className="text-xs text-zinc-500">Planifica tus trámites con una ruta formativa ordenada.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cyber-panel rounded-3xl p-8 md:p-10 border border-zinc-800/80">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Acceso seguro</p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-100">Iniciar sesion</h2>
            <p className="mt-2 text-sm text-zinc-400">Introduce tus credenciales para continuar en la plataforma.</p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-800/40 flex items-start text-red-300 text-xs gap-3">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">
                Correo electronico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@expatfiscal.es"
                  required
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-indigo-400/80 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">
                Contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-indigo-400/80 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-zinc-100 rounded-xl py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/30 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Entrar a la plataforma
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-xs text-zinc-500 leading-relaxed">
            Si no puedes acceder, contacta con administracion para validar tus permisos de cuenta.
          </p>
        </section>
      </div>
    </div>
  );
}
