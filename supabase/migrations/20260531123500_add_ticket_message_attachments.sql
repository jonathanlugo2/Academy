ALTER TABLE public.ticket_messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);

-- Create bucket for support attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for support-attachments
DROP POLICY IF EXISTS "Anyone can view support attachments" ON storage.objects;
CREATE POLICY "Anyone can view support attachments" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'support-attachments');

DROP POLICY IF EXISTS "Anyone can upload support attachments" ON storage.objects;
CREATE POLICY "Anyone can upload support attachments" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'support-attachments');

DROP POLICY IF EXISTS "Anyone can delete support attachments" ON storage.objects;
CREATE POLICY "Anyone can delete support attachments" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'support-attachments');
