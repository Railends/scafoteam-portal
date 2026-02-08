-- Create a function to delete the auth user
CREATE OR REPLACE FUNCTION public.handle_worker_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the user from auth.users (this requires bypass RLS or superuser, 
  -- but since it's a trigger created by a superuser on a target table, it works in Supabase)
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS on_worker_deleted ON public.workers;
CREATE TRIGGER on_worker_deleted
  AFTER DELETE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.handle_worker_deletion();

-- Also ensure 'worker_admin_details' is deleted if it exists
-- Usually handled by ON DELETE CASCADE if set up, but let's be safe
ALTER TABLE IF EXISTS public.worker_admin_details 
  DROP CONSTRAINT IF EXISTS worker_admin_details_worker_id_fkey,
  ADD CONSTRAINT worker_admin_details_worker_id_fkey 
    FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE CASCADE;
