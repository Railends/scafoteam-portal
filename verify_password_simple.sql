-- Verify password match and return the result as a row so it appears in the grid.
-- Replaces previous DO block.

WITH decoded_password AS (
  SELECT 
    id,
    convert_from(decode(substring(admin_data->>'password' from 5), 'base64'), 'UTF8') as plain_pass
  FROM workers
  WHERE id IN (SELECT id FROM auth.users WHERE email = 'railends.lipskis@gmail.com')
),
auth_hash AS (
  SELECT id, encrypted_password FROM auth.users WHERE email = 'railends.lipskis@gmail.com'
)
SELECT 
  dp.plain_pass as "Password We Think It Is",
  ah.encrypted_password as "Stored Hash",
  CASE 
    WHEN ah.encrypted_password = crypt(dp.plain_pass, ah.encrypted_password) THEN 'MATCH (Password is Correct)'
    ELSE 'MISMATCH (Hash is Wrong)'
  END as "Result"
FROM decoded_password dp
JOIN auth_hash ah ON dp.id = ah.id;
