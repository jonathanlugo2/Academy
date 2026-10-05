-- Las funciones de trigger no deben poder invocarse por la API (/rest/v1/rpc).
-- Postgres no comprueba EXECUTE al disparar un trigger, así que revocarlo no
-- afecta a su funcionamiento. Avisos 0028/0029 del linter de Supabase.
-- is_admin() y my_allowed_resources() se mantienen: las usan las políticas RLS.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_resource_deletion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_ticket_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_admin_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_ticket_attachment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_profile_changes() FROM PUBLIC, anon, authenticated;

-- Event trigger que activa RLS en tablas nuevas (creado desde el dashboard).
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
