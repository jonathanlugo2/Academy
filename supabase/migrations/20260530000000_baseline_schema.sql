-- Baseline: objetos que existían en la base de datos remota pero no en ninguna
-- migración (creados desde el dashboard de Supabase). Reconstruido a partir del
-- backup del 21-08-2026 para que `supabase db reset` reproduzca el esquema real.
--
-- Es idempotente. En el proyecto remoto ya está aplicado de facto: márcalo como
-- aplicado sin ejecutarlo con:
--   supabase migration repair --status applied 20260530000000

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  passport TEXT,
  nie TEXT,
  address TEXT,
  postal_code TEXT,
  arrival_date DATE,
  absences INTEGER DEFAULT 0,
  aeat_date DATE,
  ss_date DATE,
  allowed_resources TEXT[] DEFAULT '{}'::TEXT[],
  residency_doc JSONB,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  email TEXT
);

-- Función auxiliar (se redefine igual en 20260530093410)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid();
$$;

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Tabla legacy del primer sistema de mensajería (sustituida por tickets)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Alta automática del perfil al crear un usuario en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, email)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'name', 'Estudiante Nuevo'),
    coalesce(NEW.raw_app_meta_data->>'role', 'student'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Políticas creadas desde el dashboard
DROP POLICY IF EXISTS "Admins tienen control total sobre perfiles" ON public.profiles;
CREATE POLICY "Admins tienen control total sobre perfiles" ON public.profiles
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil o los admins todos" ON public.profiles;
CREATE POLICY "Los usuarios pueden ver su propio perfil o los admins todos" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil (excepto rol/fa" ON public.profiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil (excepto rol/fa" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins pueden gestionar recursos" ON public.resources;
CREATE POLICY "Admins pueden gestionar recursos" ON public.resources
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Cualquier usuario autenticado puede ver los recursos" ON public.resources;
CREATE POLICY "Cualquier usuario autenticado puede ver los recursos" ON public.resources
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Los estudiantes pueden enviar mensajes" ON public.messages;
CREATE POLICY "Los estudiantes pueden enviar mensajes" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios mensajes o los admins todos" ON public.messages;
CREATE POLICY "Los usuarios pueden ver sus propios mensajes o los admins todos" ON public.messages
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins pueden actualizar mensajes (para responder)" ON public.messages;
CREATE POLICY "Admins pueden actualizar mensajes (para responder)" ON public.messages
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins pueden borrar mensajes" ON public.messages;
CREATE POLICY "Admins pueden borrar mensajes" ON public.messages
  FOR DELETE TO authenticated USING (public.is_admin());
