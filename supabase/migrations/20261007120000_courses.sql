-- Formaciones con capítulos, lecciones y materiales (Plan Formaciones, fase 1).
-- Sustituye a resources + profiles.allowed_resources/completed_resources, que se
-- conservan sin uso hasta retirarlos en una migración posterior. No borra datos.

-------------------------------------------------------------------------------
-- 1. Tablas
-------------------------------------------------------------------------------

-- La migración phase2_storage_and_schema creó una tabla courses mínima que
-- nunca se usó (y que cualquier autenticado podía leer). Se sustituye solo si
-- está vacía; si tuviera datos, la migración se detiene.
DO $$
BEGIN
  IF to_regclass('public.courses') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'is_published') THEN
    IF EXISTS (SELECT 1 FROM public.courses) THEN
      RAISE EXCEPTION 'La tabla courses antigua tiene datos: revisar antes de migrar';
    END IF;
    DROP TABLE public.courses;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  description TEXT CHECK (char_length(description) <= 5000),
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Destino de la FK compuesta de lessons
  UNIQUE (id, course_id)
);

CREATE INDEX IF NOT EXISTS course_sections_course_idx ON public.course_sections (course_id, position);

-- course_id se repite en la lección para que las políticas no tengan que
-- pasar por el capítulo; la FK compuesta garantiza que coincide.
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  section_id UUID NOT NULL,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  description TEXT CHECK (char_length(description) <= 5000),
  type TEXT NOT NULL CHECK (type IN ('video', 'presentation', 'document', 'html_video', 'link', 'test')),
  url TEXT,
  storage_path TEXT,
  duration_seconds INT CHECK (duration_seconds >= 0),
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, course_id),
  FOREIGN KEY (section_id, course_id) REFERENCES public.course_sections(id, course_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT lessons_has_content CHECK (coalesce(btrim(url), '') <> '' OR storage_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS lessons_section_idx ON public.lessons (section_id, position);
CREATE INDEX IF NOT EXISTS lessons_course_idx ON public.lessons (course_id);
CREATE INDEX IF NOT EXISTS lessons_storage_path_idx ON public.lessons (storage_path) WHERE storage_path IS NOT NULL;

-- Material de la formación (lesson_id nulo) o de una lección concreta
CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  url TEXT,
  storage_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT CHECK (size_bytes >= 0),
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (lesson_id, course_id) REFERENCES public.lessons(id, course_id) ON DELETE CASCADE,
  CONSTRAINT course_materials_has_content CHECK (coalesce(btrim(url), '') <> '' OR storage_path IS NOT NULL),
  CONSTRAINT course_materials_https CHECK (url IS NULL OR url ~* '^https://')
);

CREATE INDEX IF NOT EXISTS course_materials_course_idx ON public.course_materials (course_id, position);
CREATE INDEX IF NOT EXISTS course_materials_storage_path_idx ON public.course_materials (storage_path) WHERE storage_path IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS course_enrollments_student_idx ON public.course_enrollments (student_id);

-- Una fila por lección abierta: completed_at nulo = vista pero no completada.
-- updated_at sirve para reanudar en la última lección vista.
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  student_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL,
  course_id UUID NOT NULL,
  completed_at TIMESTAMPTZ,
  last_position_seconds INT CHECK (last_position_seconds >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, lesson_id),
  FOREIGN KEY (lesson_id, course_id) REFERENCES public.lessons(id, course_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS lesson_progress_course_idx ON public.lesson_progress (student_id, course_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS lesson_progress_lesson_idx ON public.lesson_progress (lesson_id);

-------------------------------------------------------------------------------
-- 2. updated_at automático
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS set_updated_at ON public.courses;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.lessons;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.lesson_progress;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-------------------------------------------------------------------------------
-- 3. RLS
-------------------------------------------------------------------------------

-- Admin, o alumno inscrito en una formación publicada. SECURITY DEFINER para
-- no depender de la RLS de courses/course_enrollments dentro de las políticas.
CREATE OR REPLACE FUNCTION public.can_access_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.course_enrollments e
    JOIN public.courses c ON c.id = e.course_id
    WHERE e.course_id = p_course_id
      AND e.student_id = auth.uid()
      AND c.is_published
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_course(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_course(UUID) TO authenticated;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Formaciones: lectura con acceso" ON public.courses;
CREATE POLICY "Formaciones: lectura con acceso" ON public.courses
  FOR SELECT TO authenticated USING (public.can_access_course(id));
DROP POLICY IF EXISTS "Formaciones: gestión solo admin" ON public.courses;
CREATE POLICY "Formaciones: gestión solo admin" ON public.courses
  FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Capítulos: lectura con acceso" ON public.course_sections;
CREATE POLICY "Capítulos: lectura con acceso" ON public.course_sections
  FOR SELECT TO authenticated USING (public.can_access_course(course_id));
DROP POLICY IF EXISTS "Capítulos: gestión solo admin" ON public.course_sections;
CREATE POLICY "Capítulos: gestión solo admin" ON public.course_sections
  FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Lecciones: lectura con acceso" ON public.lessons;
CREATE POLICY "Lecciones: lectura con acceso" ON public.lessons
  FOR SELECT TO authenticated USING (public.can_access_course(course_id));
DROP POLICY IF EXISTS "Lecciones: gestión solo admin" ON public.lessons;
CREATE POLICY "Lecciones: gestión solo admin" ON public.lessons
  FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Materiales: lectura con acceso" ON public.course_materials;
CREATE POLICY "Materiales: lectura con acceso" ON public.course_materials
  FOR SELECT TO authenticated USING (public.can_access_course(course_id));
DROP POLICY IF EXISTS "Materiales: gestión solo admin" ON public.course_materials;
CREATE POLICY "Materiales: gestión solo admin" ON public.course_materials
  FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Inscripciones: lectura propia o admin" ON public.course_enrollments;
CREATE POLICY "Inscripciones: lectura propia o admin" ON public.course_enrollments
  FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
DROP POLICY IF EXISTS "Inscripciones: gestión solo admin" ON public.course_enrollments;
CREATE POLICY "Inscripciones: gestión solo admin" ON public.course_enrollments
  FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Progreso: lectura propia o admin" ON public.lesson_progress;
CREATE POLICY "Progreso: lectura propia o admin" ON public.lesson_progress
  FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
DROP POLICY IF EXISTS "Progreso: alta propia con acceso" ON public.lesson_progress;
CREATE POLICY "Progreso: alta propia con acceso" ON public.lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()) AND public.can_access_course(course_id));
DROP POLICY IF EXISTS "Progreso: cambio propio con acceso" ON public.lesson_progress;
CREATE POLICY "Progreso: cambio propio con acceso" ON public.lesson_progress
  FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()) AND public.can_access_course(course_id));
DROP POLICY IF EXISTS "Progreso: borrado propio" ON public.lesson_progress;
CREATE POLICY "Progreso: borrado propio" ON public.lesson_progress
  FOR DELETE TO authenticated USING (student_id = (SELECT auth.uid()));

-------------------------------------------------------------------------------
-- 4. Storage: los ficheros de lecciones y materiales viven en academy-resources
-------------------------------------------------------------------------------

-- Solo se puede leer un fichero referenciado por una lección o material de
-- una formación a la que se tiene acceso (la ruta por sí sola no da acceso).
DROP POLICY IF EXISTS "Lectura de ficheros de formaciones" ON storage.objects;
CREATE POLICY "Lectura de ficheros de formaciones" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'academy-resources'
    AND (
      (SELECT public.is_admin())
      OR EXISTS (
        SELECT 1 FROM public.lessons l
        WHERE l.storage_path = storage.objects.name AND public.can_access_course(l.course_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.course_materials m
        WHERE m.storage_path = storage.objects.name AND public.can_access_course(m.course_id)
      )
    )
  );

-- Los vídeos van en YouTube/Vimeo: el bucket solo admite documentos y materiales
UPDATE storage.buckets
SET file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/png', 'image/jpeg', 'image/webp', 'image/gif',
      'text/plain', 'text/csv',
      'application/zip',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
WHERE id = 'academy-resources';

-------------------------------------------------------------------------------
-- 5. RPCs de administración
-------------------------------------------------------------------------------

-- Deja la formación asignada exactamente a esos alumnos (operación atómica)
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
    WHERE p.id = ANY (ids) AND p.role = 'student'
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

-- Activa o desactiva una formación a un alumno (vista de usuarios)
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
    SELECT p_course_id, p.id FROM public.profiles p WHERE p.id = p_student_id AND p.role = 'student'
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

-- Reordena los capítulos de una formación según el orden del array
CREATE OR REPLACE FUNCTION public.reorder_course_sections(p_course_id UUID, p_section_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administración puede ordenar capítulos' USING ERRCODE = '42501';
  END IF;

  UPDATE public.course_sections s
  SET position = o.pos
  FROM unnest(p_section_ids) WITH ORDINALITY AS o(id, pos)
  WHERE s.id = o.id AND s.course_id = p_course_id;
END;
$$;

-- Reordena las lecciones de un capítulo; una lección de otro capítulo de la
-- misma formación se mueve a este.
CREATE OR REPLACE FUNCTION public.reorder_section_lessons(p_section_id UUID, p_lesson_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administración puede ordenar lecciones' USING ERRCODE = '42501';
  END IF;

  UPDATE public.lessons l
  SET position = o.pos, section_id = s.id
  FROM unnest(p_lesson_ids) WITH ORDINALITY AS o(id, pos), public.course_sections s
  WHERE l.id = o.id AND s.id = p_section_id AND l.course_id = s.course_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_course_enrollments(UUID, UUID[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_course_enrollment(UUID, UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reorder_course_sections(UUID, UUID[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reorder_section_lessons(UUID, UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_course_enrollments(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_course_enrollment(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_course_sections(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_section_lessons(UUID, UUID[]) TO authenticated;

-------------------------------------------------------------------------------
-- 6. Progreso del alumno
-------------------------------------------------------------------------------

-- Registra que el alumno abre una lección y, opcionalmente, si la completa y
-- por dónde va. SECURITY INVOKER: la RLS decide si tiene acceso.
CREATE OR REPLACE FUNCTION public.set_lesson_progress(
  p_lesson_id UUID,
  p_completed BOOLEAN DEFAULT NULL,
  p_position_seconds INT DEFAULT NULL
)
RETURNS public.lesson_progress
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_course_id UUID;
  result public.lesson_progress;
BEGIN
  SELECT course_id INTO v_course_id FROM public.lessons WHERE id = p_lesson_id;
  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'Lección no encontrada' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.lesson_progress AS lp (student_id, lesson_id, course_id, completed_at, last_position_seconds)
  VALUES (auth.uid(), p_lesson_id, v_course_id,
          CASE WHEN p_completed THEN now() END, p_position_seconds)
  ON CONFLICT (student_id, lesson_id) DO UPDATE
  SET completed_at = CASE
        WHEN p_completed IS NULL THEN lp.completed_at
        WHEN p_completed THEN coalesce(lp.completed_at, now())
        ELSE NULL
      END,
      last_position_seconds = coalesce(p_position_seconds, lp.last_position_seconds)
  RETURNING lp.* INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_lesson_progress(UUID, BOOLEAN, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_lesson_progress(UUID, BOOLEAN, INT) TO authenticated;

-------------------------------------------------------------------------------
-- 7. Traslado de los recursos actuales: cada recurso pasa a ser una formación
--    publicada con un capítulo "Contenido" y una lección. Formación y lección
--    conservan el id del recurso.
-------------------------------------------------------------------------------

DO $$
BEGIN
  -- Los ficheros de vídeo estaban en academy-videos; las lecciones solo leen de
  -- academy-resources. No hay ninguno en producción: si apareciera, se para.
  IF EXISTS (SELECT 1 FROM public.resources WHERE type = 'video' AND storage_path IS NOT NULL) THEN
    RAISE EXCEPTION 'Hay vídeos en academy-videos: moverlos antes de migrar';
  END IF;
END $$;

INSERT INTO public.courses (id, title, description, category, tags, image_url, is_published, created_at)
SELECT r.id, r.title, r.description, r.category, coalesce(r.tags, '{}'), r.image_url, true,
       coalesce(r.created_at, now())
FROM public.resources r
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.course_sections (course_id, title, position)
SELECT r.id, 'Contenido', 1
FROM public.resources r
WHERE NOT EXISTS (SELECT 1 FROM public.course_sections s WHERE s.course_id = r.id);

INSERT INTO public.lessons (id, course_id, section_id, title, description, type, url, storage_path, position, created_at)
SELECT r.id, r.id, s.id, r.title, r.description, r.type,
       CASE WHEN r.storage_path IS NULL THEN r.url END, r.storage_path, 1,
       coalesce(r.created_at, now())
FROM public.resources r
JOIN LATERAL (
  SELECT id FROM public.course_sections WHERE course_id = r.id ORDER BY position, created_at LIMIT 1
) s ON true
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.course_enrollments (course_id, student_id)
SELECT c.id, p.id
FROM public.profiles p
CROSS JOIN LATERAL unnest(coalesce(p.allowed_resources, '{}')) AS a(rid)
JOIN public.courses c ON c.id::TEXT = a.rid
WHERE p.role = 'student'
ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_progress (student_id, lesson_id, course_id, completed_at)
SELECT p.id, l.id, l.course_id, now()
FROM public.profiles p
CROSS JOIN LATERAL unnest(coalesce(p.completed_resources, '{}')) AS d(rid)
JOIN public.lessons l ON l.id = d.rid
ON CONFLICT DO NOTHING;
