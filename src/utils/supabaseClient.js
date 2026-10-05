import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
const supabaseAnonKey = rawKey.trim().replace(/^["']|["']$/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las credenciales de Supabase. Revisa tus variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Clave única para evitar colisiones de localStorage entre pestañas
    // y prevenir corrupción de tokens al crear usuarios desde Edge Functions
    storageKey: 'academy-auth-token',
  }
});
