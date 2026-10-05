-- Tests de seguridad RLS / Storage. Se ejecutan en una transacción con ROLLBACK:
-- no dejan datos. Uso contra la BD local (`supabase start`):
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/rls_security.sql
-- Si alguna comprobación falla, el script termina con "FAIL: ...".

\set QUIET on
\pset tuples_only on
\pset format unaligned
BEGIN;

CREATE SCHEMA tests;
GRANT USAGE ON SCHEMA tests TO anon, authenticated;

CREATE FUNCTION tests.ok(cond BOOLEAN, msg TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL: %', msg USING ERRCODE = 'P0T01';
  END IF;
  RAISE NOTICE 'ok - %', msg;
END $$;

-- La sentencia debe fallar (permisos, RLS WITH CHECK o validación).
CREATE FUNCTION tests.throws(stmt TEXT, msg TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE stmt;
  EXCEPTION
    WHEN SQLSTATE 'P0T01' THEN RAISE;
    WHEN OTHERS THEN
      RAISE NOTICE 'ok - % (%)', msg, SQLERRM;
      RETURN;
  END;
  RAISE EXCEPTION 'FAIL: % (no lanzó error)', msg USING ERRCODE = 'P0T01';
END $$;

-- La sentencia no debe tener efecto: o falla o no afecta a ninguna fila.
CREATE FUNCTION tests.denied(stmt TEXT, msg TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  BEGIN
    EXECUTE stmt;
    GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION
    WHEN SQLSTATE 'P0T01' THEN RAISE;
    WHEN OTHERS THEN
      RAISE NOTICE 'ok - % (%)', msg, SQLERRM;
      RETURN;
  END;
  IF n > 0 THEN
    RAISE EXCEPTION 'FAIL: % (afectó a % filas)', msg, n USING ERRCODE = 'P0T01';
  END IF;
  RAISE NOTICE 'ok - % (0 filas)', msg;
END $$;

-- La sentencia debe ejecutarse y afectar a n filas.
CREATE FUNCTION tests.affects(stmt TEXT, expected INT, msg TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  EXECUTE stmt;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM tests.ok(n = expected, msg || ' (filas: ' || n || ')');
END $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO anon, authenticated;

-- Fixtures (como superusuario) -----------------------------------------------
-- admin ........ 00000000-0000-0000-0000-00000000000a
-- alumno A ..... 00000000-0000-0000-0000-0000000000a1
-- alumno B ..... 00000000-0000-0000-0000-0000000000b1
-- recurso r1 ... 00000000-0000-0000-0000-0000000000e1 (asignado a A)
-- recurso r2 ... 00000000-0000-0000-0000-0000000000e2 (sin asignar)

INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.local', '{"name":"Admin"}', '{"role":"admin"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local', '{"name":"Alumno A"}', '{}'),
  ('00000000-0000-0000-0000-0000000000b1', 'b@test.local', '{"name":"Alumno B"}', '{}');

INSERT INTO public.resources (id, title, type, url, storage_path) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'Asignado a A', 'document', 'x', 'docs/r1.pdf'),
  ('00000000-0000-0000-0000-0000000000e2', 'Sin asignar', 'document', 'x', 'docs/r2.pdf');

UPDATE public.profiles SET allowed_resources = ARRAY['00000000-0000-0000-0000-0000000000e1']
WHERE id = '00000000-0000-0000-0000-0000000000a1';

INSERT INTO storage.objects (bucket_id, name) VALUES
  ('academy-resources', 'docs/r1.pdf'),
  ('academy-resources', 'docs/r2.pdf'),
  ('support-attachments', 'ticket-uploads/00000000-0000-0000-0000-0000000000a1/a.pdf'),
  ('support-attachments', 'ticket-uploads/00000000-0000-0000-0000-0000000000b1/b.pdf'),
  ('support-attachments', 'ticket-uploads/legacy-b.pdf'),
  ('residency-docs', '00000000-0000-0000-0000-0000000000a1/res.pdf'),
  ('residency-docs', '00000000-0000-0000-0000-0000000000b1/res.pdf');

INSERT INTO public.tickets (id, student_id, title) VALUES
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 'Ticket de B');
-- Mensaje antiguo con URL pública (formato previo a la migración)
ALTER TABLE public.ticket_messages DISABLE TRIGGER validate_ticket_attachment;
INSERT INTO public.ticket_messages (ticket_id, sender_id, content, attachment_url, attachment_type) VALUES
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 'hola',
   'https://x.supabase.co/storage/v1/object/public/support-attachments/ticket-uploads/legacy-b.pdf', 'document');
ALTER TABLE public.ticket_messages ENABLE TRIGGER validate_ticket_attachment;

-- Anónimo --------------------------------------------------------------------
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT tests.ok((SELECT count(*) FROM public.resources) = 0, 'anon no ve recursos');
SELECT tests.ok((SELECT count(*) FROM public.profiles) = 0, 'anon no ve perfiles');
SELECT tests.ok((SELECT count(*) FROM storage.objects) = 0, 'anon no ve ficheros');
RESET ROLE;
-- Como superusuario: en Supabase real anon no puede leer storage.buckets.
SELECT tests.ok((SELECT public FROM storage.buckets WHERE id = 'support-attachments') = false,
                'bucket support-attachments es privado');

-- Alumno A -------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

SELECT tests.ok((SELECT count(*) FROM public.resources) = 1, 'A solo ve el recurso asignado');
SELECT tests.ok((SELECT count(*) FROM public.profiles) = 1, 'A solo ve su perfil');

SELECT tests.throws($$UPDATE public.profiles SET allowed_resources = ARRAY['00000000-0000-0000-0000-0000000000e2'] WHERE id = auth.uid()$$,
                    'A no puede auto-asignarse recursos');
SELECT tests.throws($$UPDATE public.profiles SET arrival_date = '2020-01-01' WHERE id = auth.uid()$$,
                    'A no puede cambiar su fecha de llegada');
SELECT tests.throws($$UPDATE public.profiles SET nie = 'X0000000T' WHERE id = auth.uid()$$,
                    'A no puede cambiar su NIE');
SELECT tests.throws($$UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid()$$,
                    'A no puede hacerse admin');
SELECT tests.affects($$UPDATE public.profiles SET absences = 10, updated_at = now() WHERE id = auth.uid()$$, 1,
                     'A puede registrar sus ausencias');
SELECT tests.throws($$UPDATE public.profiles SET absences = -5 WHERE id = auth.uid()$$,
                    'ausencias negativas rechazadas');
SELECT tests.affects($$UPDATE public.profiles SET completed_resources = ARRAY['00000000-0000-0000-0000-0000000000e1']::UUID[] WHERE id = auth.uid()$$, 1,
                     'A puede completar un recurso asignado');
SELECT tests.throws($$UPDATE public.profiles SET completed_resources = ARRAY['00000000-0000-0000-0000-0000000000e2']::UUID[] WHERE id = auth.uid()$$,
                    'A no puede completar un recurso no asignado');
SELECT tests.throws($$UPDATE public.profiles SET residency_doc = '{"path":"00000000-0000-0000-0000-0000000000b1/res.pdf"}' WHERE id = auth.uid()$$,
                    'A no puede apuntar su documento a la carpeta de B');
SELECT tests.affects($$UPDATE public.profiles SET residency_doc = '{"path":"00000000-0000-0000-0000-0000000000a1/res.pdf","name":"res.pdf"}' WHERE id = auth.uid()$$, 1,
                     'A puede registrar su documento de residencia');
SELECT tests.denied($$UPDATE public.profiles SET absences = 1 WHERE id = '00000000-0000-0000-0000-0000000000b1'$$,
                    'A no puede modificar el perfil de B');

SELECT tests.ok((SELECT array_agg(name ORDER BY name) FROM storage.objects WHERE bucket_id = 'academy-resources') = ARRAY['docs/r1.pdf'],
                'A solo ve el fichero del recurso asignado');
SELECT tests.ok((SELECT array_agg(name ORDER BY name) FROM storage.objects WHERE bucket_id = 'support-attachments')
                = ARRAY['ticket-uploads/00000000-0000-0000-0000-0000000000a1/a.pdf'],
                'A solo ve sus adjuntos');
SELECT tests.ok((SELECT array_agg(name ORDER BY name) FROM storage.objects WHERE bucket_id = 'residency-docs')
                = ARRAY['00000000-0000-0000-0000-0000000000a1/res.pdf'],
                'A solo ve su documento de residencia');
SELECT tests.denied($$DELETE FROM storage.objects WHERE bucket_id = 'support-attachments'$$,
                    'A no puede borrar adjuntos');
SELECT tests.throws($$INSERT INTO storage.objects (bucket_id, name) VALUES ('support-attachments', 'ticket-uploads/00000000-0000-0000-0000-0000000000b1/x.pdf')$$,
                    'A no puede subir a la carpeta de B');
SELECT tests.affects($$INSERT INTO storage.objects (bucket_id, name) VALUES ('support-attachments', 'ticket-uploads/00000000-0000-0000-0000-0000000000a1/nuevo.pdf')$$, 1,
                     'A puede subir a su carpeta');

SELECT tests.ok((SELECT count(*) FROM public.tickets) = 0, 'A no ve tickets de B');
SELECT tests.ok((SELECT (public.create_ticket('Duda', 'Contenido', 'ticket-uploads/00000000-0000-0000-0000-0000000000a1/a.pdf', 'a.pdf', 'document')).student_id)
                = '00000000-0000-0000-0000-0000000000a1', 'A crea ticket con su adjunto (RPC)');
SELECT tests.ok((SELECT count(*) FROM public.ticket_messages) = 1, 'el ticket nace con su primer mensaje');
SELECT tests.throws($$SELECT public.create_ticket('Robo', 'x', 'ticket-uploads/00000000-0000-0000-0000-0000000000b1/b.pdf', 'b.pdf', 'document')$$,
                    'A no puede adjuntar un fichero de B');
SELECT tests.affects($$INSERT INTO public.ticket_messages (ticket_id, sender_id, content, attachment_url, attachment_name, attachment_type)
  SELECT id, auth.uid(), 'enlace trampa',
         'https://x.supabase.co/storage/v1/object/public/support-attachments/ticket-uploads/00000000-0000-0000-0000-0000000000b1/b.pdf',
         'b.pdf', 'link'
  FROM public.tickets LIMIT 1$$, 1, 'A puede publicar un enlace https cualquiera');
SELECT tests.ok(NOT EXISTS (SELECT 1 FROM storage.objects WHERE name = 'ticket-uploads/00000000-0000-0000-0000-0000000000b1/b.pdf'),
                'un enlace con la URL pública de un fichero ajeno no da acceso a él');
SELECT tests.throws($$SELECT public.create_ticket('Link', 'x', 'http://inseguro.test', 'web', 'link')$$,
                    'enlaces http rechazados');
SELECT tests.throws($$SELECT public.create_ticket('', 'x')$$, 'asunto vacío rechazado');
SELECT tests.ok((SELECT count(*) FROM public.tickets) = 1, 'los intentos fallidos no dejan tickets huérfanos');

SELECT tests.throws($$SELECT public.set_resource_assignments('00000000-0000-0000-0000-0000000000e2', ARRAY['00000000-0000-0000-0000-0000000000a1']::UUID[])$$,
                    'A no puede asignar recursos');
SELECT tests.throws($$SELECT public.admin_delete_user('00000000-0000-0000-0000-0000000000b1')$$,
                    'A no puede borrar usuarios');
RESET ROLE;

-- Alumno B: lectura de adjunto antiguo (URL pública) de su propio ticket --------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
SELECT tests.ok(EXISTS (SELECT 1 FROM storage.objects WHERE name = 'ticket-uploads/legacy-b.pdf'),
                'B sigue leyendo su adjunto antiguo');
RESET ROLE;

-- Admin ----------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);

SELECT tests.ok((SELECT count(*) FROM public.resources) = 2, 'admin ve todos los recursos');
SELECT tests.ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'support-attachments') = 4, 'admin ve todos los adjuntos');
SELECT public.set_resource_assignments('00000000-0000-0000-0000-0000000000e2',
  ARRAY['00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1']::UUID[]);
SELECT tests.ok((SELECT count(*) FROM public.profiles WHERE '00000000-0000-0000-0000-0000000000e2' = ANY (allowed_resources)) = 2,
                'admin asigna r2 a A y B');
SELECT public.set_resource_assignments('00000000-0000-0000-0000-0000000000e2', ARRAY['00000000-0000-0000-0000-0000000000b1']::UUID[]);
SELECT tests.ok((SELECT allowed_resources FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000a1')
                = ARRAY['00000000-0000-0000-0000-0000000000e1'], 'reasignar r2 solo a B se lo quita a A');
SELECT tests.ok(public.set_resource_assignment('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', false) = '{}',
                'admin desactiva r1 a A');
SELECT tests.affects($$UPDATE public.profiles SET nie = 'Y1234567X' WHERE id = '00000000-0000-0000-0000-0000000000a1'$$, 1,
                     'admin puede editar datos fiscales');
SELECT tests.ok((SELECT count(*) FROM public.audit_logs WHERE action = 'resources_assignment_changed') >= 3,
                'los cambios de asignación quedan auditados');
SELECT tests.throws($$SELECT public.admin_delete_user('00000000-0000-0000-0000-00000000000a')$$,
                    'admin no puede borrarse a sí mismo');
SELECT public.admin_delete_user('00000000-0000-0000-0000-0000000000b1');
SELECT tests.ok(NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000b1'),
                'admin_delete_user elimina el perfil');
SELECT tests.ok((SELECT count(*) FROM public.audit_logs WHERE action = 'user_deleted') = 1,
                'el borrado queda auditado');
RESET ROLE;

SELECT tests.ok(NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b1'),
                'admin_delete_user elimina también la cuenta de Auth');

-- Mantenimiento (service_role / SQL editor) sigue pudiendo cambiar roles -----
SELECT tests.affects($$UPDATE public.profiles SET role = 'admin' WHERE id = '00000000-0000-0000-0000-0000000000a1'$$, 1,
                     'el SQL editor puede cambiar roles');

\echo 'Todos los tests de RLS pasaron'
ROLLBACK;
