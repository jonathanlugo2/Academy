-- Comprueba el traslado de recursos a formaciones (migración 20261007120000_courses).
-- Uso en local, con la BD en la migración anterior y estos datos de partida:
--   1. supabase db reset sin la migración de formaciones
--   2. psql ... -v ON_ERROR_STOP=1 -f supabase/tests/courses_data_migration.sql   (fase "seed")
--   3. supabase migration up --local
--   4. psql ... -v ON_ERROR_STOP=1 -v phase=check -f supabase/tests/courses_data_migration.sql
\set QUIET on
\if :{?phase}
\else
  \set phase seed
\endif
SELECT :'phase' = 'seed' AS seeding \gset

\if :seeding
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local', '{"name":"Alumno A"}', '{}'),
  ('00000000-0000-0000-0000-0000000000b1', 'b@test.local', '{"name":"Alumno B"}', '{}');

INSERT INTO public.resources (id, title, type, url, description, category, tags, storage_path, image_url) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'Vídeo', 'video', 'https://youtu.be/x', 'desc', 'Impuestos y Autónomos', '{a,b}', NULL, 'https://img/x.png'),
  ('00000000-0000-0000-0000-0000000000e2', 'PDF', 'document', 'x', NULL, 'Trámites y Visados', '{}', 'documents/r2.pdf', NULL),
  ('00000000-0000-0000-0000-0000000000e3', 'Test', 'test', '<html></html>', NULL, NULL, NULL, NULL, NULL);

UPDATE public.profiles SET
  allowed_resources = ARRAY['00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2', 'no-existe'],
  completed_resources = ARRAY['00000000-0000-0000-0000-0000000000e1']::UUID[]
WHERE id = '00000000-0000-0000-0000-0000000000a1';
UPDATE public.profiles SET allowed_resources = ARRAY['00000000-0000-0000-0000-0000000000e3']
WHERE id = '00000000-0000-0000-0000-0000000000b1';
\echo 'Datos de partida cargados: aplica ahora la migración de formaciones'
\else
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.courses) = 3, 'una formación por recurso';
  ASSERT (SELECT bool_and(is_published) FROM public.courses), 'las formaciones migradas están publicadas';
  ASSERT (SELECT count(*) FROM public.course_sections) = 3, 'un capítulo por formación';
  ASSERT (SELECT count(*) FROM public.lessons WHERE id = course_id) = 3, 'una lección por formación, con el id del recurso';
  ASSERT (SELECT url IS NULL AND storage_path = 'documents/r2.pdf' FROM public.lessons
          WHERE id = '00000000-0000-0000-0000-0000000000e2'), 'el PDF conserva su ruta de Storage';
  ASSERT (SELECT url FROM public.lessons WHERE id = '00000000-0000-0000-0000-0000000000e3') = '<html></html>',
         'el test conserva su HTML';
  ASSERT (SELECT image_url = 'https://img/x.png' AND tags = '{a,b}' AND category = 'Impuestos y Autónomos'
          FROM public.courses WHERE id = '00000000-0000-0000-0000-0000000000e1'), 'se copian portada, etiquetas y categoría';
  ASSERT (SELECT count(*) FROM public.course_enrollments) = 3, 'se copian las asignaciones válidas';
  ASSERT (SELECT count(*) FROM public.lesson_progress WHERE completed_at IS NOT NULL) = 1, 'se copia lo completado';
  RAISE NOTICE 'Traslado de datos correcto';
END $$;
\endif
