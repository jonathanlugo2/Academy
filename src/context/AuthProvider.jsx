import { useState, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from '../utils/supabaseClient';
import { PROFILE_COLUMNS, mapProfile } from '../services/api';
import { isValidRole } from '../lib/roles';

const MISSING_PROFILE_ERROR = 'Tu cuenta no tiene un perfil activo. Contacta con administración.';
const PROFILE_LOAD_ERROR = 'No se pudo cargar tu perfil. Inténtalo de nuevo en unos minutos.';

// Perfil detallado del usuario. `failed` distingue un error de lectura (red,
// servidor) de un perfil que no existe (profile: null).
async function loadProfile(uid) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', uid)
    .maybeSingle();

  if (error) {
    console.error('Error al obtener el perfil de usuario:', error.message);
    return { profile: null, failed: true };
  }
  return { profile: mapProfile(data), failed: false };
}

const hasValidProfile = (profile) => Boolean(profile) && isValidRole(profile.role);

const toSessionUser = (authUser, profile) => ({
  id: authUser.id,
  email: authUser.email,
  ...profile
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Ref (no state) para evitar que el listener compita con login()
  const isLoggingInRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // 1. Sesión existente al cargar la app
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !mounted) return;

        const { profile, failed } = await loadProfile(session.user.id);
        if (!mounted) return;
        if (hasValidProfile(profile)) {
          setUser(toSessionUser(session.user, profile));
        } else if (!failed) {
          // Sesión sin perfil válido (p. ej. usuario eliminado): cerrarla.
          // Si solo falló la lectura se conserva para reintentar al recargar.
          await supabase.auth.signOut({ scope: 'local' });
        }
      } catch (e) {
        console.error('Error verificando la sesión activa:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // 2. Cambios de sesión (refresco de token, cierre en otra pestaña…)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || isLoggingInRef.current) return;

      if (event === 'TOKEN_REFRESHED' && session) {
        const { profile } = await loadProfile(session.user.id);
        // Si falla la lectura se conserva el usuario actual (fallo transitorio)
        if (hasValidProfile(profile) && mounted) {
          setUser(toSessionUser(session.user, profile));
        }
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
        setLoading(false);
      }
      // INITIAL_SESSION no cierra la carga: llega antes de que checkSession
      // lea el perfil y haría pasar por /login al recargar una ruta protegida
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    isLoggingInRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw new Error(error.message);

      const { profile, failed } = await loadProfile(data.user.id);
      if (!hasValidProfile(profile)) {
        await supabase.auth.signOut({ scope: 'local' });
        throw new Error(failed ? PROFILE_LOAD_ERROR : MISSING_PROFILE_ERROR);
      }

      const sessionUser = toSessionUser(data.user, profile);
      setUser(sessionUser);
      return sessionUser;
    } finally {
      isLoggingInRef.current = false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    const { profile } = await loadProfile(user.id);
    if (profile) setUser(toSessionUser(user, profile));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
