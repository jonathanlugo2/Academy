-- Rediseño de cuentas (Plan Login): rol Asesor, bajas reversibles y cambio de
-- contraseña obligatorio. Las altas, bajas y borrados pasan a la Edge Function
-- admin-users, que usa la API de administración de Auth.

-------------------------------------------------------------------------------
-- 1. Rol Asesor y estado de la cuenta
-------------------------------------------------------------------------------

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'student', 'advisor'));

-- active: false = dado de baja (Auth además bloquea el acceso con un ban).
-- must_change_password: la contraseña la generó administración o aún no existe.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Un correo, una cuenta (detecta duplicados antes de llegar a Auth)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique ON public.profiles (lower(email));

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce((SELECT active FROM public.profiles WHERE id = auth.uid()), false);
$$;

REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;

-------------------------------------------------------------------------------
-- 2. Formaciones: alumnos y asesores activos
-------------------------------------------------------------------------------

-- El token de un usuario dado de baja sigue siendo válido hasta que caduca
-- (1 h): la cuenta inactiva deja de ver contenido en cuanto se desactiva.
CREATE OR REPLACE FUNCTION public.can_access_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_admin() OR (public.is_active_user() AND EXISTS (
    SELECT 1
    FROM public.course_enrollments e
    JOIN public.courses c ON c.id = e.course_id
    WHERE e.course_id = p_course_id
      AND e.student_id = auth.uid()
      AND c.is_published
  ));
$$;


-- Deja la formación asignada exactamente a esos alumnos y asesores (operación atómica)
CREATE OR REPLACE FUNCTION public.set_course_enrollments(p_course_id UUID, p_student_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  ids CONSTANT UUID[] := coalesce(p_student_ids, '{}');
  added JSONB;
  removed JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administración puede asignar formaciones' USING ERRCODE = '42501';
  END IF;

  WITH d AS (
    DELETE FROM public.course_enrollments
    WHERE course_id = p_course_id AND NOT (student_id = ANY (ids))
    RETURNING student_id
  )
  SELECT coalesce(jsonb_agg(student_id), '[]') INTO removed FROM d;

  WITH i AS (
    INSERT INTO public.course_enrollments (course_id, student_id)
    SELECT p_course_id, p.id FROM public.profiles p
    WHERE p.id = ANY (ids) AND p.role IN ('student', 'advisor')
    ON CONFLICT DO NOTHING
    RETURNING student_id
  )
  SELECT coalesce(jsonb_agg(student_id), '[]') INTO added FROM i;

  IF added <> '[]' OR removed <> '[]' THEN
    INSERT INTO public.audit_logs (admin_id, action, details)
    VALUES (auth.uid(), 'course_enrollments_changed',
            jsonb_build_object('course_id', p_course_id, 'added', added, 'removed', removed));
  END IF;
END;
$$;


-- Activa o desactiva una formación a un alumno o asesor (vista de usuarios)
CREATE OR REPLACE FUNCTION public.set_course_enrollment(p_student_id UUID, p_course_id UUID, p_enabled BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  n INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administración puede asignar formaciones' USING ERRCODE = '42501';
  END IF;

  IF p_enabled THEN
    INSERT INTO public.course_enrollments (course_id, student_id)
    SELECT p_course_id, p.id FROM public.profiles p WHERE p.id = p_student_id AND p.role IN ('student', 'advisor')
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.course_enrollments WHERE course_id = p_course_id AND student_id = p_student_id;
  END IF;
  GET DIAGNOSTICS n = ROW_COUNT;

  IF n > 0 THEN
    INSERT INTO public.audit_logs (admin_id, action, target_user_id, details)
    VALUES (auth.uid(), 'course_enrollments_changed', p_student_id,
            jsonb_build_object('course_id', p_course_id,
                               CASE WHEN p_enabled THEN 'added' ELSE 'removed' END, jsonb_build_array(p_student_id)));
  END IF;
END;
$$;


-------------------------------------------------------------------------------
-- 3. Soporte: solo alumnos (los asesores no abren tickets)
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_ticket(
  p_title TEXT,
  p_content TEXT,
  p_attachment_url TEXT DEFAULT NULL,
  p_attachment_name TEXT DEFAULT NULL,
  p_attachment_type TEXT DEFAULT NULL
)
RETURNS public.tickets
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  new_ticket public.tickets;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('student', 'admin') AND active) THEN
    RAISE EXCEPTION 'Tu cuenta no tiene acceso al canal de soporte' USING ERRCODE = '42501';
  END IF;
  IF length(trim(coalesce(p_title, ''))) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'El asunto debe tener entre 1 y 200 caracteres' USING ERRCODE = '22023';
  END IF;
  IF length(trim(coalesce(p_content, ''))) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'El mensaje debe tener entre 1 y 5000 caracteres' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.tickets (student_id, title)
  VALUES (auth.uid(), trim(p_title))
  RETURNING * INTO new_ticket;

  INSERT INTO public.ticket_messages (ticket_id, sender_id, content, attachment_url, attachment_name, attachment_type)
  VALUES (new_ticket.id, auth.uid(), trim(p_content), p_attachment_url, p_attachment_name, p_attachment_type);

  RETURN new_ticket;
END;
$$;

-------------------------------------------------------------------------------
-- 4. Contraseñas
-------------------------------------------------------------------------------

-- El usuario la llama tras fijar su contraseña con supabase.auth.updateUser.
-- protect_admin_columns impide cambiar must_change_password con un UPDATE.
CREATE OR REPLACE FUNCTION public.complete_password_change()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.profiles SET must_change_password = false WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.complete_password_change() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_password_change() TO authenticated;

-------------------------------------------------------------------------------
-- 5. Administración de cuentas (solo la Edge Function, con service_role)
-------------------------------------------------------------------------------

-- Cuenta de Auth con ese correo y si tiene perfil. Permite recuperar cuentas
-- huérfanas (Auth sin perfil) en vez de rechazar el alta.
CREATE OR REPLACE FUNCTION public.admin_find_account(p_email TEXT)
RETURNS TABLE (user_id UUID, has_profile BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id, EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  FROM auth.users u
  WHERE lower(u.email) = lower(p_email);
$$;

REVOKE EXECUTE ON FUNCTION public.admin_find_account(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_find_account(TEXT) TO service_role;

-- El borrado lo hace admin-users con auth.admin.deleteUser
DROP FUNCTION IF EXISTS public.admin_delete_user(UUID);
