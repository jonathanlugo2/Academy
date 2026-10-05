-- Endurecimiento de seguridad (Plan de Mejora, fase 1). No borra datos.
-- Probar antes en local/staging: `supabase db reset` + `supabase/tests/rls_security.sql`.

-------------------------------------------------------------------------------
-- 1. Funciones auxiliares
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Recursos asignados al usuario en sesión. SECURITY DEFINER para poder usarse
-- en políticas de otras tablas sin depender de la RLS de profiles.
CREATE OR REPLACE FUNCTION public.my_allowed_resources()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce((SELECT allowed_resources FROM public.profiles WHERE id = auth.uid()), '{}'::TEXT[]);
$$;

REVOKE EXECUTE ON FUNCTION public.my_allowed_resources() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_allowed_resources() TO authenticated;

-------------------------------------------------------------------------------
-- 2. Perfil: el alumno solo puede modificar sus propios campos de progreso (S1)
-------------------------------------------------------------------------------

-- SECURITY INVOKER a propósito: current_user es el rol de la petición
-- (anon/authenticated); service_role y los triggers internos quedan fuera.
CREATE OR REPLACE FUNCTION public.protect_admin_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  editable CONSTANT TEXT[] := ARRAY['absences', 'completed_resources', 'residency_doc', 'updated_at'];
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - editable) IS DISTINCT FROM (to_jsonb(OLD) - editable) THEN
    RAISE EXCEPTION 'Solo administración puede modificar estos datos del perfil'
      USING ERRCODE = '42501';
  END IF;

  -- Solo se pueden marcar como completados recursos asignados
  IF EXISTS (
    SELECT 1 FROM unnest(NEW.completed_resources) AS c(rid)
    WHERE NOT (c.rid = ANY (coalesce(OLD.completed_resources, '{}')))
      AND NOT (c.rid::TEXT = ANY (coalesce(NEW.allowed_resources, '{}')))
  ) THEN
    RAISE EXCEPTION 'No puedes completar un recurso que no tienes asignado'
      USING ERRCODE = '42501';
  END IF;

  -- El documento de residencia debe estar en la carpeta del propio usuario
  IF NEW.residency_doc IS DISTINCT FROM OLD.residency_doc
     AND NEW.residency_doc IS NOT NULL
     AND NOT starts_with(coalesce(NEW.residency_doc->>'path', ''), NEW.id::TEXT || '/') THEN
    RAISE EXCEPTION 'Ruta de documento no válida' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- Mismo criterio para el trigger de rol existente (antes SECURITY DEFINER: con
-- is_admin() devolviendo false sin sesión bloquearía al service_role).
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND current_user IN ('anon', 'authenticated')
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change roles.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_admin_columns ON public.profiles;
CREATE TRIGGER protect_admin_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_admin_columns();

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_absences_range;
-- Validada al crearse: si algún perfil tuviera un valor fuera de rango la
-- migración fallará entera (es transaccional) en vez de bloquear después
-- cualquier UPDATE de esa fila.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_absences_range CHECK (absences BETWEEN 0 AND 366);

-------------------------------------------------------------------------------
-- 3. Recursos: cada alumno solo ve los que tiene asignados (S2)
-------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Cualquier usuario autenticado puede ver los recursos" ON public.resources;
DROP POLICY IF EXISTS "Alumnos ven sus recursos asignados" ON public.resources;
CREATE POLICY "Alumnos ven sus recursos asignados" ON public.resources
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin())
    OR ARRAY[id::TEXT] <@ (SELECT public.my_allowed_resources())
  );

-------------------------------------------------------------------------------
-- 4. Storage
-------------------------------------------------------------------------------

-- 4.1 Ficheros de recursos: solo si el recurso está asignado (S3)
-- Un bucket público ignoraría las políticas de lectura
UPDATE storage.buckets SET public = false WHERE id IN ('academy-resources', 'academy-videos');

DROP POLICY IF EXISTS "Students can read resources" ON storage.objects;
DROP POLICY IF EXISTS "Students can read videos" ON storage.objects;
DROP POLICY IF EXISTS "Lectura de ficheros de recursos asignados" ON storage.objects;
CREATE POLICY "Lectura de ficheros de recursos asignados" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('academy-resources', 'academy-videos')
    AND (
      (SELECT public.is_admin())
      OR EXISTS (
        SELECT 1 FROM public.resources r
        WHERE r.storage_path = storage.objects.name
          AND ARRAY[r.id::TEXT] <@ (SELECT public.my_allowed_resources())
      )
    )
  );

-- 4.2 Portadas de cursos: bucket público, no contienen datos sensibles
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-covers', 'course-covers', true, 5242880,
        ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins gestionan portadas" ON storage.objects;
CREATE POLICY "Admins gestionan portadas" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'course-covers' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'course-covers' AND (SELECT public.is_admin()));

-- 4.3 Adjuntos de soporte: privados y por propietario (S4)
UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']
WHERE id = 'support-attachments';

DROP POLICY IF EXISTS "Anyone can view support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Lectura de adjuntos propios o de mis tickets" ON storage.objects;
DROP POLICY IF EXISTS "Subida de adjuntos a la carpeta propia" ON storage.objects;
DROP POLICY IF EXISTS "Admins borran adjuntos" ON storage.objects;

-- Se puede leer: lo subido por uno mismo, o lo adjuntado en un mensaje que uno
-- puede ver (la RLS de ticket_messages ya limita a los tickets propios).
-- Incluye las URLs públicas antiguas (…/support-attachments/<ruta>), pero no
-- los enlaces: su URL la escribe el usuario y podría apuntar a ficheros ajenos.
CREATE POLICY "Lectura de adjuntos propios o de mis tickets" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (
      (SELECT public.is_admin())
      OR (storage.foldername(name))[2] = auth.uid()::TEXT
      OR EXISTS (
        SELECT 1 FROM public.ticket_messages m
        WHERE m.attachment_type IS DISTINCT FROM 'link'
          AND (
            m.attachment_url = storage.objects.name
            OR right(m.attachment_url, length(storage.objects.name) + 21)
               = '/support-attachments/' || storage.objects.name
          )
      )
    )
  );

CREATE POLICY "Subida de adjuntos a la carpeta propia" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = 'ticket-uploads'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

CREATE POLICY "Admins borran adjuntos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'support-attachments' AND (SELECT public.is_admin()));

-- Un mensaje solo puede adjuntar un enlace https o un fichero de la carpeta
-- del propio remitente (evita apuntar a ficheros ajenos para leerlos).
CREATE OR REPLACE FUNCTION public.validate_ticket_attachment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.attachment_url IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.attachment_type = 'link' THEN
    IF NEW.attachment_url !~* '^https://' THEN
      RAISE EXCEPTION 'Los enlaces adjuntos deben usar https' USING ERRCODE = '22023';
    END IF;
  ELSIF NOT starts_with(NEW.attachment_url, 'ticket-uploads/' || NEW.sender_id::TEXT || '/') THEN
    RAISE EXCEPTION 'Ruta de adjunto no válida' USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_ticket_attachment ON public.ticket_messages;
CREATE TRIGGER validate_ticket_attachment
BEFORE INSERT OR UPDATE OF attachment_url, attachment_type ON public.ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.validate_ticket_attachment();

-- 4.4 Documentos de residencia: privados, carpeta por alumno (B8)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('residency-docs', 'residency-docs', false, 5242880,
        ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Documentos de residencia: lectura" ON storage.objects;
DROP POLICY IF EXISTS "Documentos de residencia: subida" ON storage.objects;
DROP POLICY IF EXISTS "Documentos de residencia: borrado" ON storage.objects;

CREATE POLICY "Documentos de residencia: lectura" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'residency-docs'
    AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR (SELECT public.is_admin()))
  );

CREATE POLICY "Documentos de residencia: subida" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'residency-docs' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Documentos de residencia: borrado" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'residency-docs'
    AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR (SELECT public.is_admin()))
  );

-------------------------------------------------------------------------------
-- 5. search_path fijo en funciones SECURITY DEFINER (S8)
-------------------------------------------------------------------------------

ALTER FUNCTION public.handle_resource_deletion() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_ticket_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-------------------------------------------------------------------------------
-- 6. Índices para las FK usadas en políticas RLS
-------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS tickets_student_id_idx ON public.tickets (student_id);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_idx ON public.ticket_messages (ticket_id);
CREATE INDEX IF NOT EXISTS ticket_messages_sender_id_idx ON public.ticket_messages (sender_id);

-------------------------------------------------------------------------------
-- 7. audit_logs no debe impedir borrar perfiles
-------------------------------------------------------------------------------

ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_target_user_id_fkey;
ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_target_user_id_fkey
  FOREIGN KEY (target_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
