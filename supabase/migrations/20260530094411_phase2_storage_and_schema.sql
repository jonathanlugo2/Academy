-- Modificaciones en la tabla resources
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS is_local BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR,
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Nuevas Tablas Propuestas
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can modify courses" ON public.courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Configuración de Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('academy-resources', 'academy-resources', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('academy-videos', 'academy-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Sistema de Acceso Seguro (RLS en Storage)
-- Alumnos pueden leer
CREATE POLICY "Students can read resources" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'academy-resources');
CREATE POLICY "Students can read videos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'academy-videos');

-- Admins pueden gestionar
CREATE POLICY "Admins can upload resources" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'academy-resources' AND public.is_admin());
CREATE POLICY "Admins can upload videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'academy-videos' AND public.is_admin());

CREATE POLICY "Admins can update resources" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'academy-resources' AND public.is_admin()) WITH CHECK (bucket_id = 'academy-resources' AND public.is_admin());
CREATE POLICY "Admins can update videos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'academy-videos' AND public.is_admin()) WITH CHECK (bucket_id = 'academy-videos' AND public.is_admin());

CREATE POLICY "Admins can delete resources" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'academy-resources' AND public.is_admin());
CREATE POLICY "Admins can delete videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'academy-videos' AND public.is_admin());
