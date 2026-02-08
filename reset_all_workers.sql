-- DANGER: This script deletes ALL worker profiles and their associated Auth accounts.
-- It preserves accounts with role 'admin' or 'superadmin'.

-- 1. Delete from public.workers
-- We assumes workers don't have 'admin' role in their metadata, or if they do, we want to keep them.
-- If you want to delete ABSOLUTELY EVERYTHING in workers table:
-- DELETE FROM public.workers;

-- Safer approach: Delete only those who are NOT admins
DELETE FROM public.workers 
WHERE (admin_data->>'role' IS NULL OR admin_data->>'role' != 'admin');

-- 2. Delete from auth.users to clear logins and OTPs
-- This checks the 'role' in user_metadata.
DELETE FROM auth.users 
WHERE (raw_user_meta_data->>'role' IS NULL OR raw_user_meta_data->>'role' = 'worker');

-- Verify
SELECT count(*) as remaining_workers FROM public.workers;
SELECT email, raw_user_meta_data->>'role' as role FROM auth.users;
