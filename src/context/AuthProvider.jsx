import { useState, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Ref (no state) para evitar que el listener compita con login()
  // useRef no causa re-render ni re-crea la suscripción
  const isLoggingInRef = useRef(false);

  // Helper para obtener el perfil detallado del usuario de la base de datos
  const fetchProfile = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (error) throw error;
      
      // Mapear campos de base de datos (snake_case) a formato del frontend (camelCase)
      return {
        id: data.id,
        name: data.name,
        role: data.role,
        passport: data.passport,
        nie: data.nie,
        address: data.address,
        postalCode: data.postal_code,
        arrivalDate: data.arrival_date,
        absences: data.absences || 0,
        aeatDate: data.aeat_date,
        ssDate: data.ss_date,
        allowedResources: data.allowed_resources || [],
        completedResources: data.completed_resources || [],
        residencyDoc: data.residency_doc,
        email: data.email
      };
    } catch (e) {
      console.error('Error al obtener el perfil de usuario:', e);
      return null;
    }
  };

  useEffect(() => {
    // Flag to prevent updates on unmounted component
    let mounted = true;

    // 1. Initial session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const profile = await fetchProfile(session.user.id);
          if (profile && mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              ...profile
            });
          }
        }
      } catch (e) {
        console.error('Error verificando la sesión activa:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Si login() está en curso, dejar que login() maneje el estado
      // para evitar race conditions con setUser()
      if (isLoggingInRef.current) return;

      if (event === 'TOKEN_REFRESHED') {
        // Solo refrescar el perfil en token refresh automático
        if (session) {
          const profile = await fetchProfile(session.user.id);
          if (profile && mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              ...profile
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      // Ignorar SIGNED_IN (se maneja en login()), INITIAL_SESSION, USER_UPDATED, etc.
      
      // Ensure loading is false after handling the event
      if (mounted) setLoading(false);
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
        password: password
      });

      if (error) {
        throw new Error(error.message);
      }
      
      const profile = await fetchProfile(data.user.id);
      const sessionUser = {
        id: data.user.id,
        email: data.user.email,
        ...profile
      };
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
    const profile = await fetchProfile(user.id);
    if (profile) {
      setUser({
        id: user.id,
        email: user.email,
        ...profile
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export default AuthProvider;
