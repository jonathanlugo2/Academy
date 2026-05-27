import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, ArrowRight, ShieldAlert, Compass, Sparkles, Scale } from 'lucide-react';

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

  // Función de inicio rápido para facilitar las pruebas del MVP
  const handleQuickLogin = async (type) => {
    setError('');
    setIsSubmitting(true);
    const credentials = {
      admin: { email: 'admin@nomadahub.es', pass: 'admin123' },
      student: { email: 'nomada@nomadahub.es', pass: 'nomada123' }
    };

    const creds = credentials[type];
    setEmail(creds.email);
    setPassword(creds.pass);

    try {
      const loggedUser = await login(creds.email, creds.pass);
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Círculos decorativos de fondo con difuminado (Glow effects) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Header del Formulario */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-650 via-blue-600 to-indigo-600 text-white mb-4 shadow-lg shadow-blue-500/20">
            <Scale className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-blue-400 to-indigo-200 bg-clip-text text-transparent">
            ExpatFiscal Hub
          </h1>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            La plataforma definitiva de entrenamiento y asesoría fiscal para expats
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start text-red-200 text-xs gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@nomadahub.es"
                required
                className="w-full bg-slate-850/40 border border-slate-800 focus:border-blue-500/80 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-850/40 border border-slate-800 focus:border-blue-500/80 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white rounded-xl py-3 px-4 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Acceder a la Academia
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Separador */}
        <div className="relative my-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/80"></div>
          </div>
          <span className="relative px-3 bg-slate-900 text-xs font-medium text-slate-500 tracking-widest uppercase">
            Atajos de Prueba (MVP)
          </span>
        </div>

        {/* Accesos Rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleQuickLogin('admin')}
            disabled={isSubmitting}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-800 hover:border-blue-500/50 bg-slate-900/30 hover:bg-blue-950/10 text-center transition-all cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-200">Test Administrador</span>
            <span className="text-[10px] text-slate-500 mt-0.5">admin@nomadahub.es</span>
          </button>

          <button
            onClick={() => handleQuickLogin('student')}
            disabled={isSubmitting}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-800 hover:border-indigo-500/50 bg-slate-900/30 hover:bg-indigo-950/10 text-center transition-all cursor-pointer group"
          >
            <Compass className="w-4 h-4 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-200">Test Nómada</span>
            <span className="text-[10px] text-slate-500 mt-0.5">nomada@nomadahub.es</span>
          </button>
        </div>

      </div>
    </div>
  );
}
