-- Manually fix the password for railends.lipskis@gmail.com to '387242'
-- This bypasses the RPC and updates auth.users directly.

UPDATE auth.users
SET encrypted_password = crypt('387242', gen_salt('bf')),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"require_password_change": true}'::jsonb,
    updated_at = now()
WHERE email = 'railends.lipskis@gmail.com';

-- Verify the update immediately
SELECT 
    email, 
    CASE 
        WHEN encrypted_password = crypt('387242', encrypted_password) THEN 'FIXED (Password is 387242)' 
        ELSE 'FAILED' 
    END as status
FROM auth.users
WHERE email = 'railends.lipskis@gmail.com';
