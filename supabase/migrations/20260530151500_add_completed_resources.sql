-- Add completed_resources column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS completed_resources UUID[] DEFAULT '{}';
