-- Add image_url column to resources table
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS image_url TEXT;
