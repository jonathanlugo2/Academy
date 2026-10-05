-- Ausencias largas por periodos (regla de los 183 días por año natural).
-- Solo cuentan las ausencias de 30 días seguidos o más; las registra
-- administración. Sustituye a profiles.absences, que se conserva sin uso.

CREATE TABLE IF NOT EXISTS public.absence_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT CHECK (char_length(note) <= 300),
  created_by UUID DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT absence_periods_order CHECK (end_date >= start_date),
  -- Ambos días incluidos
  CONSTRAINT absence_periods_min_length CHECK (end_date - start_date + 1 >= 30)
);

CREATE INDEX IF NOT EXISTS absence_periods_student_idx ON public.absence_periods (student_id, start_date);

ALTER TABLE public.absence_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ausencias: lectura propia o admin" ON public.absence_periods;
CREATE POLICY "Ausencias: lectura propia o admin" ON public.absence_periods
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Ausencias: gestión solo admin" ON public.absence_periods;
CREATE POLICY "Ausencias: gestión solo admin" ON public.absence_periods
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Un mismo alumno no puede tener dos ausencias que se solapen
CREATE OR REPLACE FUNCTION public.check_absence_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.absence_periods a
    WHERE a.student_id = NEW.student_id
      AND a.id <> NEW.id
      AND daterange(a.start_date, a.end_date, '[]') && daterange(NEW.start_date, NEW.end_date, '[]')
  ) THEN
    RAISE EXCEPTION 'La ausencia se solapa con otra ya registrada' USING ERRCODE = '23P01';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_absence_overlap() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS check_absence_overlap ON public.absence_periods;
CREATE TRIGGER check_absence_overlap
BEFORE INSERT OR UPDATE OF student_id, start_date, end_date ON public.absence_periods
FOR EACH ROW EXECUTE FUNCTION public.check_absence_overlap();

-- El alumno ya no edita profiles.absences: se quita de las columnas editables
CREATE OR REPLACE FUNCTION public.protect_admin_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  editable CONSTANT TEXT[] := ARRAY['completed_resources', 'residency_doc', 'updated_at'];
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
