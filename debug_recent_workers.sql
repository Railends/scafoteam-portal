SELECT 
    w.id, 
    w.email, 
    w.status, 
    w.username, 
    w.created_at, 
    (w.admin_data ->> 'password') as stored_plain_password, 
    (w.admin_data ->> 'require_password_change') as require_change,
    au.encrypted_password,
    au.email_confirmed_at
FROM workers w
JOIN auth.users au ON w.id = au.id
ORDER BY w.created_at DESC
LIMIT 5;
