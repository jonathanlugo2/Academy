-- Operaciones atómicas en servidor y auditoría (Plan de Mejora, fases 2.3, 3.2, 4.3 y 4.9).

-------------------------------------------------------------------------------
-- Ticket + primer mensaje en una sola transacción (B5)
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
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_ticket public.tickets;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
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

REVOKE EXECUTE ON FUNCTION public.create_ticket(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_ticket(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-------------------------------------------------------------------------------
-- Asignación de recursos sin read-modify-write en el cliente (B11)
-------------------------------------------------------------------------------

-- Deja el recurso asignado exactamente a p_student_ids.
CREATE OR REPLACE FUNCTION public.set_resource_assignments(p_resource_id UUID, p_student_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administración puede asignar recursos' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET allowed_resources = array_append(coalesce(allowed_resources, '{}'), p_resource_id::TEXT),
      updated_at = now()
  WHERE id = ANY (coalesce(p_student_ids, '{}'))
    AND NOT (p_resource_id::TEXT = ANY (coalesce(allowed_resources, '{}')));

  UPDATE public.profiles
  SET allowed_resources = array_remove(allowed_resources, p_resource_id::TEXT),
      updated_at = now()
  WHERE NOT (id = ANY (coalesce(p_student_ids, '{}')))
    AND p_resource_id::TEXT = ANY (allowed_resources);
END;
$$;

-- Activa o desactiva un recurso para un alumno.
CREATE OR REPLACE FUNCTION public.set_resource_assignment(p_student_id UUID, p_resource_id UUID, p_enabled BOOLEAN)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  result TEXT[];
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administración puede asignar recursos' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET allowed_resources = CASE
        WHEN p_enabled THEN
          array_append(array_remove(coalesce(allowed_resources, '{}'), p_resource_id::TEXT), p_resource_id::TEXT)
        ELSE
          array_remove(coalesce(allowed_resources, '{}'), p_resource_id::TEXT)
      END,
      updated_at = now()
  WHERE id = p_student_id
  RETURNING allowed_resources INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_resource_assignments(UUID, UUID[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_resource_assignment(UUID, UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_resource_assignments(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_resource_assignment(UUID, UUID, BOOLEAN) TO authenticated;

-------------------------------------------------------------------------------
-- Borrado real de usuarios (B2): elimina la cuenta de Auth; el perfil, tickets
-- y mensajes caen por ON DELETE CASCADE.
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administración puede eliminar usuarios' USING ERRCODE = '42501';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes eliminar tu propio usuario' USING ERRCODE = '22023';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    -- Perfil huérfano sin cuenta de Auth
    DELETE FROM public.profiles WHERE id = p_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-------------------------------------------------------------------------------
-- Auditoría de cambios administrativos sobre perfiles
-------------------------------------------------------------------------------

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

  IF NEW.allowed_resources IS DISTINCT FROM OLD.allowed_resources THEN
    INSERT INTO public.audit_logs (admin_id, action, target_user_id, details)
    VALUES (
      auth.uid(),
      'resources_assignment_changed',
      NEW.id,
      jsonb_build_object(
        'added',   (SELECT coalesce(jsonb_agg(x), '[]') FROM unnest(NEW.allowed_resources) x
                    WHERE NOT (x = ANY (coalesce(OLD.allowed_resources, '{}')))),
        'removed', (SELECT coalesce(jsonb_agg(x), '[]') FROM unnest(OLD.allowed_resources) x
                    WHERE NOT (x = ANY (coalesce(NEW.allowed_resources, '{}'))))
      )
    );
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
AFTER UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_profile_changes();
