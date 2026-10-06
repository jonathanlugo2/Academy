-- Retira el modelo antiguo de recursos (Plan Formaciones, fase 6). Sus datos ya
-- están en courses, lessons, course_enrollments y lesson_progress
-- (20261007120000_courses). Antes de borrar se archiva una copia en el esquema
-- archive, que la API no expone y al que no acceden anon ni authenticated.

-------------------------------------------------------------------------------
-- 1. Copia de seguridad
-------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS archive;
REVOKE ALL ON SCHEMA archive FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF to_regclass('public.resources') IS NOT NULL AND to_regclass('archive.resources_20261007') IS NULL THEN
    CREATE TABLE archive.resources_20261007 AS SELECT * FROM public.resources;
    CREATE TABLE archive.profile_resources_20261007 AS
      SELECT id AS profile_id, allowed_resources, completed_resources FROM public.profiles;
  END IF;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA archive FROM PUBLIC, anon, authenticated;

-------------------------------------------------------------------------------
-- 2. Funciones de perfil que leían las columnas antiguas
-------------------------------------------------------------------------------

-- El alumno solo puede modificar su documento de residencia; el progreso va
-- ahora en lesson_progress.
CREATE OR REPLACE FUNCTION public.protect_admin_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  editable CONSTANT TEXT[] := ARRAY['residency_doc', 'updated_at'];
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - editable) IS DISTINCT FROM (to_jsonb(OLD) - editable) THEN
    RAISE EXCEPTION 'Solo administración puede modificar estos datos del perfil'
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

-- Los cambios de inscripción se auditan en las RPCs de course_enrollments
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Solo se auditan peticiones de usuarios (no service_role ni mantenimiento)
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (admin_id, action, target_user_id, details)
    VALUES (
      CASE WHEN OLD.id = auth.uid() THEN NULL ELSE auth.uid() END,
      'user_deleted',
      NULL,
      jsonb_build_object('user_id', OLD.id, 'email', OLD.email, 'name', OLD.name)
    );
    RETURN NULL;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO public.audit_logs (admin_id, action, target_user_id, details)
    VALUES (auth.uid(), 'role_changed', NEW.id,
            jsonb_build_object('from', OLD.role, 'to', NEW.role));
  END IF;

  RETURN NULL;
END;
$$;

-------------------------------------------------------------------------------
-- 3. Tabla, columnas, políticas y funciones del modelo antiguo
-------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Lectura de ficheros de recursos asignados" ON storage.objects;
DROP FUNCTION IF EXISTS public.set_resource_assignments(UUID, UUID[]);
DROP FUNCTION IF EXISTS public.set_resource_assignment(UUID, UUID, BOOLEAN);
-- Con la tabla se van su trigger on_resource_deleted y sus políticas
DROP TABLE IF EXISTS public.resources;
DROP FUNCTION IF EXISTS public.handle_resource_deletion();
DROP FUNCTION IF EXISTS public.my_allowed_resources();
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS allowed_resources,
  DROP COLUMN IF EXISTS completed_resources;
