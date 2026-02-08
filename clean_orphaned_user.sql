-- Deleting the orphaned user from auth.users to allow re-registration
-- NOTE: This must be run in the Supabase SQL Editor.


-- 1. First, delete from the public.workers table (this might trigger handle_worker_deletion if active)
DELETE FROM public.workers 
WHERE email = 'railends.lipskis@gmail.com';

-- 2. Then, explicitly delete from auth.users to be absolutely sure
DELETE FROM auth.users 
WHERE email = 'railends.lipskis@gmail.com';

-- Verify deletion (should return 0 rows for both)
SELECT * FROM public.workers WHERE email = 'railends.lipskis@gmail.com';
SELECT * FROM auth.users WHERE email = 'railends.lipskis@gmail.com';
