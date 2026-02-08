-- Function to allow Admins to update a worker's password
-- This allows the "Approve -> Send Temp Password" flow.

create extension if not exists pgcrypto;

CREATE OR REPLACE FUNCTION update_worker_password_by_admin(
  target_user_id UUID,
  new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- 1. Check if the caller is an admin
  -- We check the 'role' in the caller's metadata
  SELECT raw_user_meta_data->>'role' INTO caller_role
  FROM auth.users
  WHERE id = auth.uid();

  IF caller_role IS DISTINCT FROM 'admin' AND caller_role IS DISTINCT FROM 'superadmin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update worker passwords.';
  END IF;

  -- 2. Update the target user's password in auth.users
  -- We use pgcrypto's crypt function to hash it correctly for Supabase Auth (bcrypt)
  -- Note: We assume pgcrypto is installed (usually in extensions schema)
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  -- 3. Also force them to change it on next login (optional, but good practice per requirement)
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"require_password_change": true}'::jsonb
  WHERE id = target_user_id;

END;
$$;
