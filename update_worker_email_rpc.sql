-- Function to allow Admins to update a worker's email in Auth
-- This ensures that when an admin changes a worker's email in the UI, it's synced with Supabase Auth

CREATE OR REPLACE FUNCTION update_worker_email_by_admin(
  target_user_id UUID,
  new_email TEXT
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
  SELECT raw_user_meta_data->>'role' INTO caller_role
  FROM auth.users
  WHERE id = auth.uid();

  IF caller_role IS DISTINCT FROM 'admin' AND caller_role IS DISTINCT FROM 'superadmin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update worker emails.';
  END IF;

  -- 2. Update the target user's email in auth.users
  -- We also update the email_confirmed_at to ensure they aren't locked out if it was confirmed before
  UPDATE auth.users
  SET email = new_email,
      updated_at = now()
  WHERE id = target_user_id;

END;
$$;
