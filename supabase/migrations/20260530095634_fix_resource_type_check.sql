-- 1. Eliminar la restricción antigua (ajusta el nombre si es diferente, pero suele ser resources_type_check)
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_type_check;

-- 2. Añadir la nueva restricción que incluya 'html_video' y otros tipos necesarios
ALTER TABLE public.resources 
ADD CONSTRAINT resources_type_check 
CHECK (type IN ('video', 'presentation', 'document', 'html_video', 'link'));

-- 3. Asegurarse de que el trigger de auditoría o roles no esté bloqueando inserciones de admin si aplica
-- (Esto es preventivo basado en el error específico de check constraint)
