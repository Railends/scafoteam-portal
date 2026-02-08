-- Force cleanup for railends.lipskis@gmail.com to allow re-registration
-- This deletes regardless of role, to ensure no orphaned data remains.

BEGIN;

-- 1. Delete from workers table (and cascade to details)
DELETE FROM public.workers 
WHERE email = 'railends.lipskis@gmail.com';

-- 2. Delete from auth.users (Supabase Auth)
DELETE FROM auth.users 
WHERE email = 'railends.lipskis@gmail.com';

COMMIT;

-- Verify (Should be 0)
SELECT count(*) as "Workers Count" FROM public.workers WHERE email = 'railends.lipskis@gmail.com';
SELECT count(*) as "Auth Count" FROM auth.users WHERE email = 'railends.lipskis@gmail.com';
