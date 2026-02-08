-- Check if worker exists in public.workers
SELECT * FROM public.workers 
WHERE email = 'railends.lipskis@gmail.com' 
OR email = 'railends.lipkis@gmail.com';

-- Note: We cannot query auth.users directly from here usually, 
-- but if the above returns nothing, and you can login, 
-- then you have an orphaned Auth user.
