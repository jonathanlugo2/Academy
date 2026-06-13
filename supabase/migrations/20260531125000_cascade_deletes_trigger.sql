-- Trigger function to cascade resource deletes on student profiles
CREATE OR REPLACE FUNCTION public.handle_resource_deletion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET allowed_resources = array_remove(allowed_resources, OLD.id::text),
      completed_resources = array_remove(completed_resources, OLD.id)
  WHERE OLD.id::text = ANY(allowed_resources) 
     OR OLD.id = ANY(completed_resources);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function before a resource is deleted
DROP TRIGGER IF EXISTS on_resource_deleted ON public.resources;
CREATE TRIGGER on_resource_deleted
BEFORE DELETE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.handle_resource_deletion();
